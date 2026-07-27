import { StatReviewTable } from "@/components/StatReviewTable";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VerifyStatsPage() {
  await requireProfileRole(["admin"], "/verify-stats");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("stats")
    .select("id, points, rebounds, assists, source, verification_status, players(full_name), games(opponent)")
    .order("created_at", { ascending: false });

  return (
    <main className="container-page py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-court">Trust layer</p>
      <h1 className="mt-2 text-3xl font-black text-ink">Stat verification queue</h1>
      <p className="mt-2 max-w-3xl text-muted">Review submitted statistics against their evidence and save an auditable decision.</p>
      <div className="mt-8"><StatReviewTable initialRows={(rows ?? []) as never[]} /></div>
    </main>
  );
}
