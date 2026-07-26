import Image from "next/image";
import Link from "next/link";
import { MapPin, GraduationCap } from "lucide-react";
import { getPlayerStats } from "@/lib/mock-data";
import type { Player } from "@/lib/types";

export function PlayerCard({ player }: { player: Player }) {
  const stats = getPlayerStats(player.id);

  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex gap-4">
        <Image
          src={player.profilePhotoUrl ?? "https://placehold.co/240x240?text=HT"}
          alt={`${player.fullName} profile`}
          width={76}
          height={76}
          className="h-20 w-20 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/players/${player.id}`} className="text-lg font-bold text-ink hover:text-court">
            {player.fullName}
          </Link>
          <p className="mt-1 text-sm font-medium text-muted">{player.position} · {player.height} · Class of {player.graduationYear}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted"><MapPin size={13} /> {player.city}, {player.country}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 text-center">
        <MiniStat label="PPG" value={stats.ppg} />
        <MiniStat label="RPG" value={stats.rpg} />
        <MiniStat label="APG" value={stats.apg} />
        <MiniStat label="3P%" value={stats.three} />
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <span className="flex items-center gap-1 text-muted"><GraduationCap size={15} /> {player.school}</span>
        <span className="font-semibold text-trust">{player.verificationScore}% trust</span>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}
