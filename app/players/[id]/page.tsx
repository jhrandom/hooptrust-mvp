import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, LockKeyhole, MailPlus } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatBadge } from "@/components/StatBadge";
import { games, getPlayerStats, players, statLines } from "@/lib/mock-data";

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = players.find((item) => item.id === id);
  if (!player) notFound();

  const stats = getPlayerStats(player.id);
  const lines = statLines.filter((line) => line.playerId === player.id);

  return (
    <main className="container-page py-10">
      <Link href="/dashboard/recruiter" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Back to search
      </Link>
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-white shadow-sm">
        <div className="bg-gradient-to-br from-ink to-slate-700 p-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex gap-5">
              <Image
                src={player.profilePhotoUrl ?? "https://placehold.co/240x240?text=HT"}
                alt={`${player.fullName} profile`}
                width={120}
                height={120}
                className="h-28 w-28 rounded-3xl border-4 border-white/20 object-cover"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-200">Recruiter-ready profile</p>
                <h1 className="mt-2 text-4xl font-black">{player.fullName}</h1>
                <p className="mt-2 text-white/80">
                  {player.position} · {player.height} · {player.weight} · Class of {player.graduationYear}
                </p>
                <p className="mt-1 text-white/80">{player.school} · {player.city}, {player.country}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">HoopTrust verification score</p>
              <p className="mt-1 text-4xl font-black">{player.verificationScore}%</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_330px]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="PPG" value={stats.ppg} helper="Verified or submitted games" />
              <MetricCard label="RPG" value={stats.rpg} helper="Verified or submitted games" />
              <MetricCard label="APG" value={stats.apg} helper="Verified or submitted games" />
              <MetricCard label="3P%" value={stats.three} helper="Verified or submitted games" />
            </div>

            <section className="mt-8 rounded-3xl border border-line p-6">
              <h2 className="text-xl font-black text-ink">Player overview</h2>
              <p className="mt-3 leading-7 text-muted">{player.bio}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info label="Dominant hand" value={player.dominantHand} />
                <Info label="Current team" value={player.team} />
                <Info label="Jersey" value={`#${player.jerseyNumber}`} />
                <Info label="Recruiting status" value={player.recruitingStatus} />
                <Info label="Academic information" value={player.gpa ?? "Available upon request"} />
                <Info label="Intended major" value={player.intendedMajor ?? "Undecided"} />
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-line p-6">
              <h2 className="text-xl font-black text-ink">Game-by-game verification</h2>
              <div className="mt-5 space-y-4">
                {lines.map((line) => {
                  const game = games.find((item) => item.id === line.gameId);
                  return (
                    <div key={line.id} className="rounded-2xl bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{game?.teamName} vs {game?.opponent}</p>
                          <p className="text-sm text-muted">{game?.date} · {game?.tournament}</p>
                        </div>
                        <StatBadge status={line.verificationStatus} />
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-2 text-center md:grid-cols-8">
                        <Mini label="PTS" value={line.points} />
                        <Mini label="REB" value={line.rebounds} />
                        <Mini label="AST" value={line.assists} />
                        <Mini label="STL" value={line.steals} />
                        <Mini label="BLK" value={line.blocks} />
                        <Mini label="TO" value={line.turnovers} />
                        <Mini label="FG" value={`${line.fgm}/${line.fga}`} />
                        <Mini label="3PT" value={`${line.tpm}/${line.tpa}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-line bg-slate-50 p-6">
              <h2 className="text-lg font-black text-ink">Recruiter actions</h2>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-court px-4 py-3 font-bold text-white">
                <MailPlus size={18} /> Request contact
              </button>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-3 font-bold text-ink">
                Save player
              </button>
              <p className="mt-4 flex gap-2 text-xs leading-5 text-muted">
                <LockKeyhole size={16} className="shrink-0" />
                Direct personal contact information is hidden until the player, guardian, or admin approves the request.
              </p>
            </div>
            <div className="rounded-3xl border border-line p-6">
              <h2 className="text-lg font-black text-ink">Evidence links</h2>
              <div className="mt-4 space-y-3">
                {games.map((game) => (
                  <a key={game.id} href={game.videoUrl} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
                    {game.opponent} <ExternalLink size={15} />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-bold text-ink">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white px-2 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}
