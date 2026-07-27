import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change"
]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const type = rawType && emailOtpTypes.has(rawType as EmailOtpType)
    ? rawType as EmailOtpType
    : null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/login?error=Invalid%20or%20incomplete%20confirmation%20link.", request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/player", request.url)
  );
}

export const dynamic = "force-dynamic";
