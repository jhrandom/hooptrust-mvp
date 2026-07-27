import Link from "next/link";
import { UploadCloud, UserRoundCog, BadgeCheck, Mail } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { getPlayerStats, players } from "@/lib/mock-data";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function PlayerDashboardPage() {
  await requireAuthenticatedUser("/dashboard/player");
  const player = players[0];
  const stats = getPlayerStats(player.id);

  return (
    <main className="container-page py-10">
      <h1 className="text-3xl font-black text-ink">Player dashboard</h1>
      <p className="mt-2 text-muted">Manage your recruiting profile, videos, and stat verification.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Profile trust score" value={`${player.verificationScore}%`} helper="Based on verified evidence" />
        <MetricCard label="Verified games" value={stats.verifiedCount} helper="Approved by admin" />
        <MetricCard label="Pending reviews" value={stats.pendingCount} helper="Awaiting verification" />
        <MetricCard label="Recruiter requests" value="1" helper="Needs response" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Action href="/profile" icon={<UserRoundCog />} title="Edit profile" body="Create or update your recruiting information." />
        <Action href="/upload" icon={<UploadCloud />} title="Upload game" body="Add video link and match context." />
        <Action href="/verify-stats" icon={<BadgeCheck />} title="Verification status" body="Track pending and verified stats." />
        <Action href="/contact-requests" icon={<Mail />} title="Contact requests" body="Approve or decline recruiter requests." />
      </div>
    </main>
  );
}

function Action({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-court">{icon}</div>
      <h2 className="mt-5 font-black text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </Link>
  );
}
