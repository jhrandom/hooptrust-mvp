import { VerificationTable } from "@/components/VerificationTable";

export default function VerifyStatsPage() {
  return (
    <main className="container-page py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-court">Trust layer</p>
      <h1 className="mt-2 text-3xl font-black text-ink">Stat verification queue</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Admins review submitted stats against linked video evidence, coach stat sheets, tournament records, or future AI partner output.
        Verified stat lines become visible on player profiles with a HoopTrust badge.
      </p>
      <div className="mt-8">
        <VerificationTable />
      </div>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-black text-ink">Approve</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Use when stats match the game evidence or trusted source.</p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-black text-ink">Needs correction</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Use when data looks close but needs a player, coach, or admin correction.</p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-black text-ink">Reject</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Use when stats are unsupported, inaccurate, duplicated, or linked to the wrong video.</p>
        </div>
      </section>
    </main>
  );
}
