import { BadgeCheck, MailWarning, ShieldCheck, UsersRound, Video } from "lucide-react";
import { VerificationTable } from "@/components/VerificationTable";
import { contactRequests, players, recruiters, statLines } from "@/lib/mock-data";

export default function AdminPage() {
  const pendingStats = statLines.filter((line) => line.verificationStatus === "pending").length;
  const pendingRecruiters = recruiters.filter((recruiter) => recruiter.status === "pending").length;

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
        <AdminMetric icon={<Video />} label="Videos" value="2" />
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
            <button className="mt-5 w-full rounded-full bg-ink px-5 py-3 font-bold text-white">Review applications</button>
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
