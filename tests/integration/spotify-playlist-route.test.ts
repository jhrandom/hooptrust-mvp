import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  readStored: vi.fn(),
  ensureFresh: vi.fn(),
  findTracks: vi.fn(),
  createPlaylist: vi.fn(),
  storeSession: vi.fn()
}));

vi.mock("@/lib/spotify", () => ({
  spotifyCookieNames: { sessionId: "sid", session: "legacy", sessionChunks: [] },
  readStoredSpotifySession: mocks.readStored,
  openSplitSpotifySession: vi.fn(() => null),
  openSpotifySession: vi.fn(() => null),
  ensureFreshSpotifySession: mocks.ensureFresh,
  findSpotifyTracks: mocks.findTracks,
  createSpotifyPlaylist: mocks.createPlaylist,
  storeSpotifySession: mocks.storeSession
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getClaims: vi.fn(async () => ({ data: { claims: null } })) },
    from: vi.fn()
  }))
}));

import { POST } from "@/app/api/spotify/playlist/route";

function request(body: unknown) {
  return new NextRequest("http://test/api/spotify/playlist", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  });
}

const validBody = { situationId: "training", moodId: "tired", goalId: "push-intensity", allowExplicit: false };

describe("POST /api/spotify/playlist", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it("rejects invalid recommendation selections", async () => {
    const response = await POST(request({ situationId: "invalid" }));
    expect(response.status).toBe(400);
  });

  it("requires a recoverable Spotify session", async () => {
    mocks.readStored.mockResolvedValue(null);
    const response = await POST(request(validBody));
    expect(response.status).toBe(401);
  });

  it("creates a private playlist from filtered Spotify results", async () => {
    const session = { accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 60_000 };
    mocks.readStored.mockResolvedValue(session);
    mocks.ensureFresh.mockResolvedValue(session);
    mocks.findTracks.mockResolvedValue([
      { uri: "spotify:track:1", name: "Track", artists: [{ name: "Artist" }] }
    ]);
    mocks.createPlaylist.mockResolvedValue({ external_urls: { spotify: "https://open.spotify.com/playlist/1" } });

    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(mocks.findTracks).toHaveBeenCalledWith("access", expect.any(Array), false);
    expect(mocks.createPlaylist).toHaveBeenCalledWith(
      "access", expect.stringContaining("Training"), expect.stringContaining("Private HoopTrust"), ["spotify:track:1"]
    );
    expect(await response.json()).toMatchObject({
      playlistUrl: "https://open.spotify.com/playlist/1",
      tracks: [{ name: "Track", artist: "Artist" }]
    });
  });

  it("maps Spotify failures to a gateway error", async () => {
    const session = { accessToken: "access" };
    mocks.readStored.mockResolvedValue(session);
    mocks.ensureFresh.mockRejectedValue(new Error("Spotify token refresh failed"));
    const response = await POST(request(validBody));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: "Spotify token refresh failed" });
  });
});
