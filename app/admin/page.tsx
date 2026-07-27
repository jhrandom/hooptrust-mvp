import { BadgeCheck, MailWarning, ShieldCheck, UsersRound, Video } from "lucide-react";
import { RecruiterApprovalList } from "@/components/DecisionList";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EvidenceReviewList, type EvidenceRow } from "@/components/EvidenceReviewList";
import { StatReviewTable } from "@/components/StatReviewTable";
import { AdminContactOversight, type AdminContactRow } from "@/components/AdminContactOversight";

export default async function AdminPage() {
  await requireProfileRole(["admin"], "/admin");
  const supabase = await createClient();
  const { data: pendingRecruiterRows } = await supabase
    .from("recruiters")
    .select("id, full_name, program, title, email, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const [
    { count: playerCount },
    { count: recruiterCount },
    { count: pendingStatCount },
    { count: contactRequestCount },
    { count: videoCount }
  ] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("recruiters").select("*", { count: "exact", head: true }),
    supabase.from("stats").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("contact_requests").select("*", { count: "exact", head: true }),
    supabase.from("videos").select("*", { count: "exact", head: true })
  ]);
  const { data: statRows, error: statError } = await supabase
    .from("stats")
    .select("id, points, rebounds, assists, source, verification_status, players(full_name), games(opponent)")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: contactRows, error: contactError } = await supabase
    .from("contact_requests")
    .select("id, message, status, created_at, recruiters(full_name, program, email), players(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: playerRows, error: playerError } = await supabase
    .from("players")
    .select("id, full_name, school, country, graduation_year, visibility, recruiting_status, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  const { data: auditRows, error: auditError } = await supabase
    .from("admin_action_logs")
    .select("id, action, entity_type, entity_id, details, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(30);
  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("videos")
    .select("id, player_id, game_id, video_url, approval_status, created_at, players(full_name), games(opponent, game_date, tournament)")
    .order("created_at", { ascending: false });
  const evidenceGameIds = (evidenceRows ?? []).map((row) => row.game_id).filter((id): id is string => Boolean(id));
  const { data: evidenceStats, error: evidenceStatsError } = evidenceGameIds.length
    ? await supabase
        .from("stats")
        .select("game_id, player_id, jersey_number, points, rebounds, assists, steals, blocks, turnovers, fgm, fga, tpm, tpa, ftm, fta, minutes, verification_status")
        .in("game_id", evidenceGameIds)
    : { data: [], error: null };
  const pendingRecruiters = pendingRecruiterRows?.length ?? 0;

  return (
    <main className="container-page py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-court">Operations dashboard</p>
      <h1 className="mt-2 text-3xl font-black text-ink">HoopTrust admin</h1>
      <p className="mt-2 text-muted">Moderate safety, approve recruiters, review videos, and verify stat credibility.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AdminMetric icon={<UsersRound />} label="Players" value={playerCount ?? 0} />
        <AdminMetric icon={<ShieldCheck />} label="Recruiters" value={recruiterCount ?? 0} />
        <AdminMetric icon={<BadgeCheck />} label="Pending stats" value={pendingStatCount ?? 0} />
        <AdminMetric icon={<MailWarning />} label="Contact requests" value={contactRequestCount ?? 0} />
        <AdminMetric icon={<Video />} label="Videos" value={videoCount ?? 0} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black text-ink">Video evidence queue</h2>
        {evidenceError || evidenceStatsError ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{evidenceError?.message ?? evidenceStatsError?.message}</p> : null}
        <EvidenceReviewList initialRows={(evidenceRows ?? []).map((row) => ({
          ...row,
          players: Array.isArray(row.players) ? row.players[0] ?? null : row.players,
          games: Array.isArray(row.games) ? row.games[0] ?? null : row.games,
          stats: (evidenceStats ?? []).find((stat) => stat.game_id === row.game_id && stat.player_id === row.player_id) ?? null
        })) as EvidenceRow[]} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 text-xl font-black text-ink">Stat verification queue</h2>
          {statError ? <ErrorNotice message={statError.message} /> : null}
          <StatReviewTable initialRows={(statRows ?? []).map((row) => ({
            ...row,
            players: Array.isArray(row.players) ? row.players[0] ?? null : row.players,
            games: Array.isArray(row.games) ? row.games[0] ?? null : row.games
          })) as never[]} />
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-ink">Recruiter approvals</h2>
            <p className="mt-2 text-sm text-muted">{pendingRecruiters} recruiter account awaiting review.</p>
            <div className="mt-5">
              <RecruiterApprovalList initialRows={pendingRecruiterRows ?? []} />
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-ink">Safety reminders</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>• Keep minor contact information hidden by default.</li>
              <li>• Approve recruiter accounts manually.</li>
              <li>• Keep video visibility private until approved.</li>
              <li>• Log every verification decision.</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Contact-access oversight</h2>
          <p className="mt-2 text-sm text-muted">Review request history and revoke inappropriate approved access.</p>
          {contactError ? <ErrorNotice message={contactError.message} /> : null}
          <div className="mt-5">
            <AdminContactOversight initialRows={(contactRows ?? []).map((row) => ({
              ...row,
              recruiters: Array.isArray(row.recruiters) ? row.recruiters[0] ?? null : row.recruiters,
              players: Array.isArray(row.players) ? row.players[0] ?? null : row.players
            })) as AdminContactRow[]} />
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Recent administrative actions</h2>
          <p className="mt-2 text-sm text-muted">A permanent trail of privileged decisions.</p>
          {auditError ? <ErrorNotice message={auditError.message} /> : null}
          <div className="mt-5 space-y-3">
            {(auditRows ?? []).map((row) => {
              const admin = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
              return <div key={row.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold text-ink">{humanize(row.action)}</p><p className="mt-1 text-xs text-muted">{admin?.full_name ?? "Admin"} · {row.entity_type} · {new Date(row.created_at).toLocaleString()}</p></div>;
            })}
            {!auditRows?.length && !auditError ? <p className="text-sm text-muted">No administrative actions logged yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink">Player visibility monitor</h2>
        <p className="mt-2 text-sm text-muted">Review recently created profiles and their current exposure level.</p>
        {playerError ? <ErrorNotice message={playerError.message} /> : null}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="p-3">Player</th><th className="p-3">School</th><th className="p-3">Country</th><th className="p-3">Class</th><th className="p-3">Visibility</th><th className="p-3">Status</th></tr></thead>
            <tbody className="divide-y divide-line">{(playerRows ?? []).map((player) => <tr key={player.id}><td className="p-3 font-bold text-ink">{player.full_name}</td><td className="p-3 text-muted">{player.school}</td><td className="p-3 text-muted">{player.country}</td><td className="p-3">{player.graduation_year}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{humanize(player.visibility ?? "private")}</span></td><td className="p-3">{player.recruiting_status}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return <p className="my-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{message}</p>;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AdminMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-court">{icon}</div>
      <p className="mt-4 text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-black text-ink">{value}</p>
    </div>
  );
}
