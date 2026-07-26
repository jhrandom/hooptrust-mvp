import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRhythmRecommendation } from "@/lib/rhythm-data";
import { createSpotifyPlaylist, ensureFreshSpotifySession, findSpotifyTracks, openSpotifySession, openSplitSpotifySession, readStoredSpotifySession, spotifyCookieNames, storeSpotifySession } from "@/lib/spotify";

const requestSchema = z.object({
  situationId: z.enum(["pre-game", "training", "post-game"]),
  moodId: z.string().min(1).max(50),
  goalId: z.enum(["lock-in", "get-hyped", "calm-nerves", "push-intensity", "steady-rhythm", "recover", "reset"]),
  allowExplicit: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid playlist request." }, { status: 400 });

  const sessionId = request.cookies.get(spotifyCookieNames.sessionId)?.value;
  const legacyValue = request.cookies.get(spotifyCookieNames.session)?.value;
  const storedSession =
    readStoredSpotifySession(sessionId) ??
    openSplitSpotifySession(spotifyCookieNames.sessionChunks.map((name) => request.cookies.get(name)?.value)) ??
    (legacyValue ? openSpotifySession(legacyValue) : null);
  if (!storedSession) return NextResponse.json({ error: "Connect Spotify first." }, { status: 401 });

  try {
    const session = await ensureFreshSpotifySession(storedSession);
    const recommendation = getRhythmRecommendation(parsed.data.situationId, parsed.data.moodId, parsed.data.goalId);
    const tracks = await findSpotifyTracks(session.accessToken, recommendation.tracks, parsed.data.allowExplicit);
    if (!tracks.length) return NextResponse.json({ error: "No suitable Spotify tracks were found. Try another selection." }, { status: 404 });

    const playlist = await createSpotifyPlaylist(
      session.accessToken,
      recommendation.playlistName,
      `Private HoopTrust Rhythm playlist · ${recommendation.vibe} · ${recommendation.bpmRange}`,
      tracks.map((track) => track.uri)
    );
    const response = NextResponse.json({
      playlistUrl: playlist.external_urls.spotify,
      playlistName: recommendation.playlistName,
      tracks: tracks.map((track) => ({ name: track.name, artist: track.artists.map((artist) => artist.name).join(", ") }))
    });
    if (session !== storedSession) {
      storeSpotifySession(session, sessionId);
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spotify playlist creation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
