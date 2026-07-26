import { Search } from "lucide-react";
import { PlayerCard } from "@/components/PlayerCard";
import { players } from "@/lib/mock-data";

export default function RecruiterDashboardPage() {
  return (
    <main className="container-page py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-court">Approved recruiter portal</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Discover verified international players</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Search by class year, position, location, and verified performance metrics. This page currently uses mock data.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(4,1fr)]">
          <label className="relative">
            <Search className="absolute left-4 top-3.5 text-muted" size={18} />
            <input className="w-full rounded-2xl border border-line py-3 pl-11 pr-4" placeholder="Search player, school, or country" />
          </label>
          <select className="rounded-2xl border border-line px-4 py-3 text-sm">
            <option>All positions</option>
            <option>PG</option>
            <option>SG</option>
            <option>SF</option>
            <option>PF</option>
            <option>C</option>
          </select>
          <select className="rounded-2xl border border-line px-4 py-3 text-sm">
            <option>All grad years</option>
            <option>2027</option>
            <option>2028</option>
            <option>2029</option>
          </select>
          <select className="rounded-2xl border border-line px-4 py-3 text-sm">
            <option>All countries</option>
            <option>South Korea</option>
            <option>Japan</option>
            <option>China</option>
          </select>
          <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white">Apply filters</button>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {players.map((player) => <PlayerCard key={player.id} player={player} />)}
      </section>
    </main>
  );
}
