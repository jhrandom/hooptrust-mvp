import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const { data: player } = await supabase.from("players").select("*").eq("user_id", userId).maybeSingle();
  const [contact, videos, stats, requests, schedule, playlists] = player ? await Promise.all([
    supabase.from("player_contact_details").select("*").eq("player_id", player.id).maybeSingle(),
    supabase.from("videos").select("*").eq("player_id", player.id),
    supabase.from("stats").select("*").eq("player_id", player.id),
    supabase.from("contact_requests").select("*").eq("player_id", player.id),
    supabase.from("player_schedule").select("*").eq("player_id", player.id),
    supabase.from("rhythm_playlists").select("*").eq("user_id", userId)
  ]) : [{ data: null }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const body = JSON.stringify({
    exported_at: new Date().toISOString(),
    account_profile: profile,
    player_profile: player,
    designated_contact: contact.data,
    videos: videos.data,
    stats: stats.data,
    contact_requests: requests.data,
    schedule: schedule.data,
    rhythm_playlists: playlists.data
  }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hooptrust-player-export-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
