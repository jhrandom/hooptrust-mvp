import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  playerId: z.string().uuid(),
  message: z.string().trim().min(10).max(1000)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a message of at least 10 characters." }, { status: 400 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: allowed } = await supabase.rpc("consume_rate_limit", { p_bucket: "contact_request", p_limit: 10, p_window_seconds: 86400 });
  if (!allowed) return NextResponse.json({ error: "Contact-request limit reached. Try again tomorrow." }, { status: 429 });

  const { data: recruiter } = await supabase
    .from("recruiters")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!recruiter || recruiter.status !== "approved") {
    return NextResponse.json({ error: "Only approved recruiters can request contact." }, { status: 403 });
  }

  const { data, error } = await supabase.from("contact_requests").insert({
    recruiter_id: recruiter.id,
    player_id: parsed.data.playerId,
    message: parsed.data.message,
    status: "pending"
  }).select("id, status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

const decisionSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["approved", "declined"])
});

export async function PATCH(request: Request) {
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) return NextResponse.json({ error: "Player profile required." }, { status: 403 });
  if (parsed.data.status === "approved") {
    const { data: designatedContact } = await supabase
      .from("player_contact_details")
      .select("player_id, consent_confirmed_at")
      .eq("player_id", player.id)
      .maybeSingle();
    if (!designatedContact?.consent_confirmed_at) {
      return NextResponse.json({
        error: "Add a designated contact and confirm sharing permission in your player profile before approving this request."
      }, { status: 409 });
    }
  }
  const { data, error } = await supabase.from("contact_requests").update({
    status: parsed.data.status,
    decided_at: new Date().toISOString()
  }).eq("id", parsed.data.requestId).eq("player_id", player.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  return NextResponse.json({ status: parsed.data.status });
}
