import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createPkcePair, createSpotifyAuthorizeUrl, getSpotifyConfig, spotifyCookieNames } from "@/lib/spotify";

export async function GET(request: Request) {
  const config = getSpotifyConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/rhythm?spotify=not-configured", request.url));
  }

  // OAuth state cookies are host-bound. If the app was opened with `localhost`
  // while Spotify redirects to `127.0.0.1`, first move the browser to the
  // configured callback origin so the state cookie survives the round trip.
  const callbackUrl = new URL(config.redirectUri);
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (requestHost && requestHost !== callbackUrl.host) {
    return NextResponse.redirect(new URL("/api/spotify/connect", callbackUrl.origin));
  }

  const state = randomBytes(24).toString("base64url");
  const { verifier, challenge } = createPkcePair();
  const response = NextResponse.redirect(createSpotifyAuthorizeUrl(state, challenge));
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
  response.cookies.set(spotifyCookieNames.state, state, cookieOptions);
  response.cookies.set(spotifyCookieNames.verifier, verifier, cookieOptions);
  return response;
}
