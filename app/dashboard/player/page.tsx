import Link from "next/link";
import { UploadCloud, UserRoundCog, BadgeCheck, Mail } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PlayerDashboardPage() {
  const auth = await requireProfileRole(["player", "guardian"], "/dashboard/player");
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id, full_name").eq("user_id", auth!.userId).maybeSingle();

  let verifiedCount = 0;
  let pendingCount = 0;
  let requestCount = 0;
  if (player) {
    const [{ count: verified }, { count: pending }, { count: requests }] = await Promise.all([
      supabase.from("stats").select("*", { count: "exact", head: true }).eq("player_id", player.id).eq("verification_status", "verified"),
      supabase.from("stats").select("*", { count: "exact", head: true }).eq("player_id", player.id).eq("verification_status", "pending"),
      supabase.from("contact_requests").select("*", { count: "exact", head: true }).eq("player_id", player.id).eq("status", "pending")
    ]);
    verifiedCount = verified ?? 0;
    pendingCount = pending ?? 0;
    requestCount = requests ?? 0;
  }

  return (
    <main className="container-page py-10">
      <h1 className="text-3xl font-black text-ink">Player portal</h1>
      <p className="mt-2 text-muted">Manage your recruiting profile, videos, statistics, and recruiter requests.</p>
      {!player ? (
        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="font-black text-ink">Complete your player profile first</h2>
          <p className="mt-2 text-sm text-muted">A profile connects your game submissions and makes the upload workflow available.</p>
          <Link href="/profile" className="mt-4 inline-flex rounded-full bg-court px-5 py-3 font-bold text-white">Create player profile</Link>
        </div>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Verified games" value={verifiedCount} helper="Approved by an administrator" />
        <MetricCard label="Pending reviews" value={pendingCount} helper="Awaiting verification" />
        <MetricCard label="Recruiter requests" value={requestCount} helper="Awaiting your response" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Action href="/profile" icon={<UserRoundCog />} title={player ? "Edit profile" : "Create profile"} body="Manage your recruiting information and visibility." />
        <Action href="/upload" icon={<UploadCloud />} title="Upload stats and video" body="Submit a game, video link, and stat line." />
        <Action href="/submissions" icon={<BadgeCheck />} title="Submission status" body="Track pending and verified statistics." />
        <Action href="/contact-requests" icon={<Mail />} title="Contact requests" body="Approve or decline recruiter requests." />
      </div>
    </main>
  );
}

function Action({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return <Link href={href} className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-court">{icon}</div><h2 className="mt-5 font-black text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{body}</p></Link>;
}
