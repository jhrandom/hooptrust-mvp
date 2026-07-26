import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { RhythmTrack } from "./rhythm-data";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";

export const spotifyScopes = ["playlist-modify-private"];
export const spotifyCookieNames = {
  state: "hooptrust_spotify_state",
  verifier: "hooptrust_spotify_verifier",
  sessionId: "hooptrust_spotify_session_id",
  session: "hooptrust_spotify_session",
  sessionChunks: [
    "hooptrust_spotify_session_0",
    "hooptrust_spotify_session_1",
    "hooptrust_spotify_session_2"
  ]
};

export type SpotifySession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type StoredSpotifySession = {
  sealed: string;
  storedUntil: number;
};

const spotifySessionFile = join(process.cwd(), ".data", "spotify-sessions.json");

type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export function getSpotifyConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function createPkcePair() {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createSpotifyAuthorizeUrl(state: string, challenge: string) {
  const config = getSpotifyConfig();
  if (!config) throw new Error("Spotify is not configured.");

  const query = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: spotifyScopes.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
    show_dialog: "true"
  });
  return `${SPOTIFY_ACCOUNTS}/authorize?${query}`;
}

export async function exchangeSpotifyCode(code: string, verifier: string): Promise<SpotifySession> {
  const config = requireSpotifyConfig();
  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      code_verifier: verifier
    }),
    cache: "no-store"
  });
  const tokens = await readSpotifyResponse<SpotifyTokenResponse>(response);
  if (!tokens.refresh_token) throw new Error("Spotify did not return a refresh token.");
  return toSession(tokens, tokens.refresh_token);
}

export async function refreshSpotifySession(session: SpotifySession): Promise<SpotifySession> {
  const config = requireSpotifyConfig();
  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken }),
    cache: "no-store"
  });
  const tokens = await readSpotifyResponse<SpotifyTokenResponse>(response);
  return toSession(tokens, tokens.refresh_token ?? session.refreshToken);
}

export async function ensureFreshSpotifySession(session: SpotifySession) {
  return session.expiresAt > Date.now() + 60_000 ? session : refreshSpotifySession(session);
}

export function storeSpotifySession(session: SpotifySession, existingId?: string) {
  const id = existingId ?? randomBytes(32).toString("base64url");
  const sessions = readSpotifySessionFile();
  sessions[id] = {
    sealed: sealSpotifySession(session),
    storedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
  writeSpotifySessionFile(sessions);
  return id;
}

export function readStoredSpotifySession(id: string | undefined) {
  if (!id) return null;
  const sessions = readSpotifySessionFile();
  const stored = sessions[id];
  if (!stored || stored.storedUntil < Date.now()) {
    if (stored) {
      delete sessions[id];
      writeSpotifySessionFile(sessions);
    }
    return null;
  }
  return openSpotifySession(stored.sealed);
}

export function deleteStoredSpotifySession(id: string | undefined) {
  if (!id) return;
  const sessions = readSpotifySessionFile();
  if (sessions[id]) {
    delete sessions[id];
    writeSpotifySessionFile(sessions);
  }
}

function readSpotifySessionFile(): Record<string, StoredSpotifySession> {
  try {
    return JSON.parse(readFileSync(spotifySessionFile, "utf8"));
  } catch {
    return {};
  }
}

function writeSpotifySessionFile(sessions: Record<string, StoredSpotifySession>) {
  mkdirSync(dirname(spotifySessionFile), { recursive: true });
  const temporaryFile = `${spotifySessionFile}.${process.pid}.tmp`;
  writeFileSync(temporaryFile, JSON.stringify(sessions), { encoding: "utf8", mode: 0o600 });
  renameSync(temporaryFile, spotifySessionFile);
}

export async function getSpotifyProfile(accessToken: string) {
  const response = await spotifyFetch(accessToken, "/me");
  return readSpotifyResponse<{ id: string; display_name?: string; external_urls?: { spotify?: string } }>(response);
}

export async function findSpotifyTracks(
  accessToken: string,
  tracks: RhythmTrack[],
  allowExplicit: boolean,
  targetCount = 10
) {
  const resultGroups = await Promise.all(
    tracks.map(async (track) => {
      const query = new URLSearchParams({ q: track.spotifySearchQuery, type: "track", limit: "10" });
      const response = await spotifyFetch(accessToken, `/search?${query}`);
      const data = await readSpotifyResponse<{
        tracks?: { items?: Array<{ uri: string; explicit: boolean; name: string; artists: Array<{ name: string }> }> };
      }>(response);
      return (data.tracks?.items ?? []).filter((item) => allowExplicit || !item.explicit);
    })
  );

  // Round-robin across the recommendation queries so that one search phrase
  // cannot fill the entire playlist. Spotify URIs also prevent duplicates.
  const selected: Array<{
    uri: string;
    explicit: boolean;
    name: string;
    artists: Array<{ name: string }>;
  }> = [];
  const seenUris = new Set<string>();
  const longestGroup = Math.max(0, ...resultGroups.map((group) => group.length));

  for (let resultIndex = 0; resultIndex < longestGroup && selected.length < targetCount; resultIndex += 1) {
    for (const group of resultGroups) {
      const candidate = group[resultIndex];
      if (!candidate || seenUris.has(candidate.uri)) continue;
      selected.push(candidate);
      seenUris.add(candidate.uri);
      if (selected.length === targetCount) break;
    }
  }

  return selected;
}

export async function createSpotifyPlaylist(accessToken: string, name: string, description: string, uris: string[]) {
  const createResponse = await spotifyFetch(accessToken, "/me/playlists", {
    method: "POST",
    body: JSON.stringify({ name, description, public: false })
  });
  const playlist = await readSpotifyResponse<{ id: string; external_urls: { spotify: string } }>(createResponse);

  if (uris.length) {
    const addResponse = await spotifyFetch(accessToken, `/playlists/${playlist.id}/items`, {
      method: "POST",
      body: JSON.stringify({ uris })
    });
    await readSpotifyResponse(addResponse);
  }
  return playlist;
}

export function sealSpotifySession(session: SpotifySession) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function splitSpotifySession(session: SpotifySession) {
  const sealed = sealSpotifySession(session);
  const chunks = sealed.match(/.{1,3000}/g) ?? [];
  if (chunks.length > spotifyCookieNames.sessionChunks.length) {
    throw new Error("Spotify session is too large to store securely.");
  }
  return chunks;
}

export function openSplitSpotifySession(values: Array<string | undefined>) {
  const sealed = values.filter((value): value is string => Boolean(value)).join("");
  return sealed ? openSpotifySession(sealed) : null;
}

export function openSpotifySession(value: string): SpotifySession | null {
  try {
    const [iv, tag, ciphertext] = value.split(".").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));
  } catch {
    return null;
  }
}

function getEncryptionKey() {
  const config = requireSpotifyConfig();
  return createHash("sha256").update(`${config.clientSecret}:hooptrust-spotify-session`).digest();
}

function requireSpotifyConfig() {
  const config = getSpotifyConfig();
  if (!config) throw new Error("Spotify credentials are missing. Add them to .env.local.");
  return config;
}

function toSession(tokens: SpotifyTokenResponse, refreshToken: string): SpotifySession {
  return {
    accessToken: tokens.access_token,
    refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000
  };
}

function spotifyFetch(accessToken: string, path: string, init: RequestInit = {}) {
  return fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store"
  });
}

async function readSpotifyResponse<T = unknown>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? body?.error_description ?? "Spotify request failed.";
    throw new Error(message);
  }
  return body as T;
}
