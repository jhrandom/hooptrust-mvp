import { NextResponse } from "next/server";
import { deleteStoredSpotifySession, spotifyCookieNames } from "@/lib/spotify";

export async function POST(request: Request) {
  const sessionCookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${spotifyCookieNames.sessionId}=`));
  deleteStoredSpotifySession(sessionCookie?.slice(sessionCookie.indexOf("=") + 1));
  const response = NextResponse.json({ connected: false });
  response.cookies.delete(spotifyCookieNames.sessionId);
  response.cookies.delete(spotifyCookieNames.session);
  spotifyCookieNames.sessionChunks.forEach((name) => response.cookies.delete(name));
  return response;
}
