import { NextRequest, NextResponse } from "next/server";
import { deleteStoredSpotifySession, readStoredSpotifySession, spotifyCookieNames, storeSpotifySession } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket") ?? undefined;
  const session = await readStoredSpotifySession(ticket);
  const destination = new URL(
    session ? "/rhythm?spotify=connected" : "/rhythm?spotify=session-not-ready",
    request.url
  );
  const response = NextResponse.redirect(destination);
  if (session) {
    await deleteStoredSpotifySession(ticket);
    const sessionId = await storeSpotifySession(session);
    response.cookies.set(spotifyCookieNames.sessionId, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const dynamic = "force-dynamic";
