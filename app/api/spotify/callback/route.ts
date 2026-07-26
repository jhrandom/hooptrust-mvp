import { NextRequest, NextResponse } from "next/server";
import { exchangeSpotifyCode, spotifyCookieNames, storeSpotifySession } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const expectedState = request.cookies.get(spotifyCookieNames.state)?.value;
  const verifier = request.cookies.get(spotifyCookieNames.verifier)?.value;

  if (error) return NextResponse.redirect(new URL(`/rhythm?spotify=${encodeURIComponent(error)}`, request.url));
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.redirect(new URL("/rhythm?spotify=invalid-state", request.url));
  }

  try {
    const session = await exchangeSpotifyCode(code, verifier);
    const completionUrl = new URL("/api/spotify/complete", request.url);
    completionUrl.searchParams.set("ticket", storeSpotifySession(session));
    const response = NextResponse.redirect(completionUrl);
    response.cookies.delete(spotifyCookieNames.session);
    spotifyCookieNames.sessionChunks.forEach((name) => response.cookies.delete(name));
    response.cookies.delete(spotifyCookieNames.state);
    response.cookies.delete(spotifyCookieNames.verifier);
    return response;
  } catch (error) {
    console.error("Spotify OAuth token exchange failed:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/rhythm?spotify=connection-failed", request.url));
  }
}
