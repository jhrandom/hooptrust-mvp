import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, LockKeyhole } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { RecruiterActions } from "@/components/RecruiterActions";
import { StatBadge } from "@/components/StatBadge";
import { requireAuthenticatedUser } from "@/lib/auth";
import { games as sampleGames, getPlayerStats, players as samplePlayers, statLines as sampleStatLines } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { PortalBackLink } from "@/components/PortalBackLink";

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const samplePlayer = samplePlayers.find((item) => item.id === id);
  if (samplePlayer) return <SampleProfile player={samplePlayer} />;

  await requireAuthenticatedUser(`/players/${id}`);
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("*").eq("id", id).maybeSingle();
  if (!player) notFound();

  const { data: stats } = await supabase
    .from("stats")
    .select("*, games(opponent, game_date, tournament)")
    .eq("player_id", id)
    .order("created_at", { ascending: false });
  const { data: videos } = await supabase
    .from("videos")
    .select("id, video_url, games(opponent)")
    .eq("player_id", id)
    .eq("approval_status", "approved");

  return (
    <main className="container-page py-10">
      <PortalBackLink />
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-white shadow-sm">
        <div className="bg-gradient-to-br from-ink to-slate-700 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-200">Recruiting profile</p>
          <h1 className="mt-2 text-4xl font-black">{player.full_name}</h1>
          <p className="mt-2 text-white/80">{player.position || "Position not provided"} · {player.height || "Height not provided"} · Class of {player.graduation_year || "—"}</p>
          <p className="mt-1 text-white/80">{player.school || "School not provided"} · {[player.city, player.country].filter(Boolean).join(", ")}</p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_330px]">
          <div>
            <section className="rounded-3xl border border-line p-6">
              <h2 className="text-xl font-black text-ink">Player overview</h2>
              <p className="mt-3 leading-7 text-muted">{player.bio || "No biography has been added."}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info label="Dominant hand" value={player.dominant_hand} />
                <Info label="Current team" value={player.current_team} />
                <Info label="Jersey" value={player.jersey_number === null ? null : `#${player.jersey_number}`} />
                <Info label="Recruiting status" value={player.recruiting_status} />
                <Info label="Academic information" value={player.gpa} />
                <Info label="Intended major" value={player.intended_major} />
              </div>
            </section>
            <section className="mt-8 rounded-3xl border border-line p-6">
              <h2 className="text-xl font-black text-ink">Game-by-game verification</h2>
              <div className="mt-5 space-y-4">
                {(stats ?? []).map((line) => {
                  const game = Array.isArray(line.games) ? line.games[0] : line.games;
                  return (
                    <div key={line.id} className="rounded-2xl bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-ink">vs {game?.opponent ?? "Opponent"}</p>
                        <StatBadge status={line.verification_status} />
                      </div>
                      <p className="mt-2 text-sm text-muted">{line.points} PTS · {line.rebounds} REB · {line.assists} AST</p>
                    </div>
                  );
                })}
                {!stats?.length ? <p className="text-sm text-muted">No stat lines have been submitted.</p> : null}
              </div>
            </section>
          </div>
          <aside className="space-y-4">
            <div className="rounded-3xl border border-line bg-slate-50 p-6">
              <h2 className="text-lg font-black text-ink">Recruiter actions</h2>
              <RecruiterActions playerId={player.id} />
              <p className="mt-4 flex gap-2 text-xs leading-5 text-muted"><LockKeyhole size={16} className="shrink-0" />Personal contact information stays hidden until a request is approved.</p>
            </div>
            <div className="rounded-3xl border border-line p-6">
              <h2 className="text-lg font-black text-ink">Approved evidence</h2>
              <div className="mt-4 space-y-3">
                {(videos ?? []).filter((video) => video.video_url).map((video) => (
                  <a key={video.id} href={video.video_url!} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
                    View video <ExternalLink size={15} />
                  </a>
                ))}
                {!videos?.length ? <p className="text-sm text-muted">No approved evidence yet.</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 font-bold text-ink">{value || "Not provided"}</p></div>;
}

function SampleProfile({ player }: { player: (typeof samplePlayers)[number] }) {
  const stats = getPlayerStats(player.id);
  const lines = sampleStatLines.filter((line) => line.playerId === player.id);
  return (
    <main className="container-page py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Back home</Link>
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-white shadow-sm">
        <div className="bg-gradient-to-br from-ink to-slate-700 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-200">Sample recruiter-ready profile</p>
          <h1 className="mt-2 text-4xl font-black">{player.fullName}</h1>
          <p className="mt-2 text-white/80">{player.position} · {player.height} · {player.weight} · Class of {player.graduationYear}</p>
          <p className="mt-1 text-white/80">{player.school} · {player.city}, {player.country}</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="PPG" value={stats.ppg} helper="Sample verified games" />
            <MetricCard label="RPG" value={stats.rpg} helper="Sample verified games" />
            <MetricCard label="APG" value={stats.apg} helper="Sample verified games" />
            <MetricCard label="3P%" value={stats.three} helper="Sample verified games" />
          </div>
          <section className="mt-8 rounded-3xl border border-line p-6">
            <h2 className="text-xl font-black text-ink">Player overview</h2>
            <p className="mt-3 leading-7 text-muted">{player.bio}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="Dominant hand" value={player.dominantHand} />
              <Info label="Current team" value={player.team} />
              <Info label="Jersey" value={`#${player.jerseyNumber}`} />
              <Info label="Recruiting status" value={player.recruitingStatus} />
              <Info label="Academic information" value={player.gpa ?? null} />
              <Info label="Intended major" value={player.intendedMajor ?? null} />
            </div>
          </section>
          <section className="mt-8 rounded-3xl border border-line p-6">
            <h2 className="text-xl font-black text-ink">Game-by-game verification</h2>
            <div className="mt-5 space-y-4">
              {lines.map((line) => {
                const game = sampleGames.find((item) => item.id === line.gameId);
                return (
                  <div key={line.id} className="rounded-2xl bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="font-bold text-ink">vs {game?.opponent}</p><p className="text-sm text-muted">{game?.date} · {game?.tournament}</p></div>
                      <StatBadge status={line.verificationStatus} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-ink">{line.points} PTS · {line.rebounds} REB · {line.assists} AST · {line.steals} STL</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
