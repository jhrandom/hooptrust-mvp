import Link from "next/link";
import { StatBadge } from "@/components/StatBadge";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalBackLink } from "@/components/PortalBackLink";

export default async function SubmissionsPage() {
  const auth = await requireProfileRole(["player", "guardian"], "/submissions");
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id").eq("user_id", auth!.userId).maybeSingle();
  const { data: stats } = player
    ? await supabase.from("stats").select("id, points, rebounds, assists, verification_status, created_at, games(opponent, game_date)").eq("player_id", player.id).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="container-page py-10">
      <PortalBackLink />
      <h1 className="text-3xl font-black text-ink">Submission status</h1>
      <p className="mt-2 text-muted">Track the statistics you have submitted for verification.</p>
      <div className="mt-8 space-y-4">
        {(stats ?? []).map((line) => {
          const game = Array.isArray(line.games) ? line.games[0] : line.games;
          return <article key={line.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm"><div><p className="font-black text-ink">vs {game?.opponent ?? "Opponent"}</p><p className="mt-1 text-sm text-muted">{line.points} PTS · {line.rebounds} REB · {line.assists} AST</p></div><StatBadge status={line.verification_status} /></article>;
        })}
        {!stats?.length ? <div className="rounded-3xl border border-line bg-white p-6"><p className="text-muted">No submissions yet.</p><Link href="/upload" className="mt-4 inline-flex rounded-full bg-court px-5 py-3 font-bold text-white">Submit your first game</Link></div> : null}
      </div>
    </main>
  );
}
