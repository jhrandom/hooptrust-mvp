import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalNumber = z.number().int().min(0).max(999).nullable();
const updateSchema = z.object({
  videoUrl: z.string().url().max(2000),
  stats: z.record(z.string(), optionalNumber)
});

async function context(id: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: NextResponse.json({ error: "Log in to continue." }, { status: 401 }) };
  const { data: video } = await supabase.from("videos").select("id, game_id, player_id, approval_status").eq("id", id).eq("uploaded_by", userId).maybeSingle();
  if (!video) return { error: NextResponse.json({ error: "Submission not found." }, { status: 404 }) };
  if (video.approval_status !== "pending") return { error: NextResponse.json({ error: "Only pending submissions can be changed." }, { status: 409 }) };
  return { supabase, video };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the video URL and statistics." }, { status: 400 });
  const result = await context(id);
  if ("error" in result) return result.error;
  const { supabase, video } = result;
  const allowed = ["jersey_number", "points", "rebounds", "assists", "steals", "blocks", "turnovers", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "minutes"];
  const stats = Object.fromEntries(Object.entries(parsed.data.stats).filter(([key]) => allowed.includes(key)));
  const { error: videoError } = await supabase.from("videos").update({ video_url: parsed.data.videoUrl }).eq("id", video.id);
  if (videoError) return NextResponse.json({ error: videoError.message }, { status: 400 });
  const { error: statsError } = await supabase.from("stats").update({ ...stats, updated_at: new Date().toISOString() }).eq("game_id", video.game_id).eq("player_id", video.player_id);
  if (statsError) return NextResponse.json({ error: statsError.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await context(id);
  if ("error" in result) return result.error;
  const { supabase, video } = result;
  const { error: statsError } = await supabase.from("stats").delete().eq("game_id", video.game_id).eq("player_id", video.player_id);
  if (statsError) return NextResponse.json({ error: statsError.message }, { status: 400 });
  const { error: videoError } = await supabase.from("videos").delete().eq("id", video.id);
  if (videoError) return NextResponse.json({ error: videoError.message }, { status: 400 });
  if (video.game_id) await supabase.from("games").delete().eq("id", video.game_id);
  return NextResponse.json({ deleted: true });
}
