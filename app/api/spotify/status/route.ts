import { NextRequest, NextResponse } from "next/server";
import { ensureFreshSpotifySession, getSpotifyConfig, openSpotifySession, openSplitSpotifySession, readStoredSpotifySession, spotifyCookieNames, storeSpotifySession } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const configured = Boolean(getSpotifyConfig());
  const sessionId = request.cookies.get(spotifyCookieNames.sessionId)?.value;
  const legacyValue = request.cookies.get(spotifyCookieNames.session)?.value;
  const storedSession =
    await readStoredSpotifySession(sessionId) ??
    openSplitSpotifySession(spotifyCookieNames.sessionChunks.map((name) => request.cookies.get(name)?.value)) ??
    (legacyValue ? openSpotifySession(legacyValue) : null);
  if (!storedSession) return NextResponse.json({ configured, connected: false });

  try {
    const session = await ensureFreshSpotifySession(storedSession);
    const response = NextResponse.json({ configured, connected: true });
    if (session !== storedSession) {
      await storeSpotifySession(session, sessionId);
    }
    return response;
  } catch {
    const response = NextResponse.json({ configured, connected: false });
    response.cookies.delete(spotifyCookieNames.sessionId);
    response.cookies.delete(spotifyCookieNames.session);
    spotifyCookieNames.sessionChunks.forEach((name) => response.cookies.delete(name));
    return response;
  }
}

export const dynamic = "force-dynamic";
