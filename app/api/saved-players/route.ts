import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ playerId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid player." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: recruiter } = await supabase.from("recruiters").select("id, status").eq("user_id", userId).maybeSingle();
  if (!recruiter || recruiter.status !== "approved") return NextResponse.json({ error: "Approved recruiter access required." }, { status: 403 });
  const { error } = await supabase.from("saved_players").upsert({
    recruiter_id: recruiter.id,
    player_id: parsed.data.playerId
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}
