import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordAdminAction } from "@/lib/admin-audit";
import { getStatConsistencyError } from "@/lib/stat-validation";

const nullableStat = (max: number) => z.number().int().min(0).max(max).nullable();
const schema = z.object({
  videoId: z.string().uuid(),
  stats: z.object({
    jersey_number: nullableStat(999),
    points: nullableStat(300),
    rebounds: nullableStat(100),
    assists: nullableStat(100),
    steals: nullableStat(100),
    blocks: nullableStat(100),
    turnovers: nullableStat(100),
    fgm: nullableStat(300),
    fga: nullableStat(300),
    tpm: nullableStat(300),
    tpa: nullableStat(300),
    ftm: nullableStat(300),
    fta: nullableStat(300),
    minutes: nullableStat(200)
  })
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the manually entered statistics." }, { status: 400 });
  const consistencyError = getStatConsistencyError(parsed.data.stats);
  if (consistencyError) return NextResponse.json({ error: consistencyError }, { status: 400 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("player_id, game_id")
    .eq("id", parsed.data.videoId)
    .maybeSingle();
  if (videoError) return NextResponse.json({ error: videoError.message }, { status: 400 });
  if (!video?.player_id || !video.game_id) return NextResponse.json({ error: "This video is not linked to a player and game." }, { status: 409 });

  const { data: existing, error: existingError } = await supabase
    .from("stats")
    .select("id")
    .eq("player_id", video.player_id)
    .eq("game_id", video.game_id)
    .limit(1)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });

  const values = {
    ...parsed.data.stats,
    player_id: video.player_id,
    game_id: video.game_id,
    source: "admin_video_review",
    verification_status: "verified",
    confidence: "High",
    updated_at: new Date().toISOString()
  };
  if (!existing) Object.assign(values, { submitted_values: parsed.data.stats });
  const result = existing
    ? await supabase.from("stats").update(values).eq("id", existing.id).select("*").single()
    : await supabase.from("stats").insert(values).select("*").single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { error: recordError } = await supabase.from("verification_records").insert({
    stat_id: result.data.id,
    verified_by: userId,
    verification_source: "admin_video_review",
    confidence: "High",
    final_status: "verified",
    admin_notes: "Statistics manually registered after video review."
  });
  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 400 });

  await recordAdminAction(supabase, userId, "stats_manually_registered", "stat", result.data.id, {
    video_id: parsed.data.videoId
  });
  return NextResponse.json({ stats: result.data });
}
