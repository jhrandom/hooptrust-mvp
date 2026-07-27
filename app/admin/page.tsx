import { BadgeCheck, MailWarning, ShieldCheck, UsersRound, Video } from "lucide-react";
import { VerificationTable } from "@/components/VerificationTable";
import { RecruiterApprovalList } from "@/components/DecisionList";
import { contactRequests, players, recruiters, statLines } from "@/lib/mock-data";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EvidenceReviewList, type EvidenceRow } from "@/components/EvidenceReviewList";

export default async function AdminPage() {
  await requireProfileRole(["admin"], "/admin");
  const supabase = await createClient();
  const { data: pendingRecruiterRows } = await supabase
    .from("recruiters")
    .select("id, full_name, program, email, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("videos")
    .select("id, video_url, approval_status, created_at, players(full_name), games(opponent, game_date, tournament)")
    .order("created_at", { ascending: false });
  const pendingStats = statLines.filter((line) => line.verificationStatus === "pending").length;
  const pendingRecruiters = pendingRecruiterRows?.length ?? recruiters.filter((recruiter) => recruiter.status === "pending").length;

  return (
    <main className="container-page py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-court">Operations dashboard</p>
      <h1 className="mt-2 text-3xl font-black text-ink">HoopTrust admin</h1>
      <p className="mt-2 text-muted">Moderate safety, approve recruiters, review videos, and verify stat credibility.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AdminMetric icon={<UsersRound />} label="Players" value={players.length} />
        <AdminMetric icon={<ShieldCheck />} label="Recruiters" value={recruiters.length} />
        <AdminMetric icon={<BadgeCheck />} label="Pending stats" value={pendingStats} />
        <AdminMetric icon={<MailWarning />} label="Contact requests" value={contactRequests.length} />
        <AdminMetric icon={<Video />} label="Videos" value={evidenceRows?.length ?? 0} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black text-ink">Video evidence queue</h2>
        {evidenceError ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{evidenceError.message}</p> : null}
        <EvidenceReviewList initialRows={(evidenceRows ?? []).map((row) => ({
          ...row,
          players: Array.isArray(row.players) ? row.players[0] ?? null : row.players,
          games: Array.isArray(row.games) ? row.games[0] ?? null : row.games
        })) as EvidenceRow[]} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 text-xl font-black text-ink">Verification queue</h2>
          <VerificationTable />
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
    </main>
  );
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
