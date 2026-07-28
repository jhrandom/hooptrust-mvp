import Link from "next/link";
import { PlayerSubmissions } from "@/components/PlayerSubmissions";
import { PortalBackLink } from "@/components/PortalBackLink";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SubmissionsPage() {
  const auth = await requireProfileRole(["player", "guardian"], "/submissions");
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id").eq("user_id", auth!.userId).maybeSingle();
  const { data: videos } = player
    ? await supabase.from("videos").select("id, game_id, video_url, approval_status, review_notes, is_highlight, highlight_order, games(opponent, game_date)").eq("player_id", player.id).order("created_at", { ascending: false })
    : { data: [] };
  const gameIds = (videos ?? []).map((video) => video.game_id).filter((id): id is string => Boolean(id));
  const { data: stats } = gameIds.length
    ? await supabase.from("stats").select("*").eq("player_id", player!.id).in("game_id", gameIds)
    : { data: [] };
  const rows = (videos ?? []).map((video) => ({
    ...video,
    approval_status: video.approval_status ?? "pending",
    games: Array.isArray(video.games) ? video.games[0] ?? null : video.games,
    stats: (stats ?? []).find((line) => line.game_id === video.game_id) ?? null
  }));
  return <main className="container-page py-10"><PortalBackLink /><h1 className="text-3xl font-black text-ink">Submissions and feedback</h1><p className="mt-2 text-muted">Track review decisions, read administrator feedback, and edit or withdraw evidence while it is pending.</p><div className="mt-8"><PlayerSubmissions initialRows={rows} /></div>{!player ? <Link href="/profile">Create profile</Link> : null}</main>;
}
