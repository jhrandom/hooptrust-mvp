import { Headphones, Music2, Sparkles } from "lucide-react";
import { RhythmPlanner } from "@/components/RhythmPlanner";

export default function RhythmPage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-white via-green-50 to-orange-50 py-16">
        <div className="container-page">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700">
            <Headphones size={16} /> HoopTrust Rhythm · Spotify integration
          </span>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-ink md:text-6xl">
                Recommend music for every athlete moment.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
                HoopTrust Rhythm helps players choose a situation and mood, then build a private Spotify playlist for pre-game preparation, training, or post-game recovery.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-soft backdrop-blur">
              <div className="grid gap-3">
                <MiniFeature icon={<Sparkles />} title="Situation-based" body="Pre-game, training, and post-game flows." />
                <MiniFeature icon={<Music2 />} title="Mood-aware" body="Recommendations change based on athlete mood and goal." />
                <MiniFeature icon={<Headphones />} title="Spotify connected" body="Create a private playlist and open it in Spotify." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <RhythmPlanner />
      </section>
    </main>
  );
}

function MiniFeature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-line bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">{icon}</span>
      <span>
        <span className="block font-black text-ink">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-muted">{body}</span>
      </span>
    </div>
  );
}
