import Link from "next/link";
import { games, players, statLines } from "@/lib/mock-data";
import { StatBadge } from "./StatBadge";

export function VerificationTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-4">Player</th>
            <th className="px-5 py-4">Game</th>
            <th className="px-5 py-4">PTS</th>
            <th className="px-5 py-4">REB</th>
            <th className="px-5 py-4">AST</th>
            <th className="px-5 py-4">Source</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {statLines.map((line) => {
            const player = players.find((item) => item.id === line.playerId);
            const game = games.find((item) => item.id === line.gameId);
            return (
              <tr key={line.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-ink">{player?.fullName}</td>
                <td className="px-5 py-4 text-muted">vs {game?.opponent}</td>
                <td className="px-5 py-4">{line.points}</td>
                <td className="px-5 py-4">{line.rebounds}</td>
                <td className="px-5 py-4">{line.assists}</td>
                <td className="px-5 py-4 capitalize text-muted">{line.source.replace("_", " ")}</td>
                <td className="px-5 py-4"><StatBadge status={line.verificationStatus} /></td>
                <td className="px-5 py-4">
                  <Link href="/verify-stats" className="font-semibold text-court">Review</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
