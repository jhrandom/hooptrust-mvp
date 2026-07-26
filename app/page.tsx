import Link from "next/link";
import { ArrowRight, BadgeCheck, Globe2, Headphones, Search, UploadCloud } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PlayerCard } from "@/components/PlayerCard";
import { players } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-white via-orange-50 to-teal-50 py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-court">
              MVP scaffold · Verified basketball recruiting
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-ink md:text-6xl">
              Turn game footage into trusted recruiting profiles.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              HoopTrust helps overlooked international basketball players become discoverable through verified stats,
              video evidence, and recruiter-ready player profiles.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-court px-6 py-3 font-bold text-white shadow-sm">
                Start beta profile <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard/recruiter" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 font-bold text-ink">
                View recruiter portal
              </Link>
              <Link href="/rhythm" className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-6 py-3 font-bold text-green-700">
                Explore Rhythm <Headphones size={18} />
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-soft backdrop-blur">
            <PlayerCard player={players[0]} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricCard label="Verified stat lines" value="50+" helper="MVP beta target" />
              <MetricCard label="Recruiter requests" value="3+" helper="Early traction goal" />
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-ink">MVP workflow</h2>
          <p className="mt-3 text-muted">
            This starter app models the first product loop: upload evidence, verify stats, publish trusted profile,
            and let approved recruiters request contact.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Step icon={<UploadCloud />} title="Upload" body="Players or coaches add game video links and game context." />
          <Step icon={<BadgeCheck />} title="Verify" body="Admins review stats against video, coach sheets, or AI partner output." />
          <Step icon={<Globe2 />} title="Publish" body="Verified data appears on a recruiter-ready profile page." />
          <Step icon={<Search />} title="Discover" body="Approved recruiters search, save players, and request contact." />
          <Step icon={<Headphones />} title="Rhythm" body="Players choose a situation and mood to generate Spotify-ready music routines." />
        </div>
      </section>
    </main>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-court">{icon}</div>
      <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
