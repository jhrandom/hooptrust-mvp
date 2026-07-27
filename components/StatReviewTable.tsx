"use client";

import { useState } from "react";
import { StatBadge } from "./StatBadge";

type Row = {
  id: string;
  points: number;
  rebounds: number;
  assists: number;
  source: string;
  verification_status: "not_submitted" | "pending" | "verified" | "needs_correction" | "rejected";
  players: { full_name: string } | null;
  games: { opponent: string } | null;
};

export function StatReviewTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function decide(statId: string, status: "verified" | "needs_correction" | "rejected") {
    setBusyId(statId);
    setNotice(null);
    const response = await fetch("/api/stats/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statId, status, confidence: status === "verified" ? "High" : "Low" })
    });
    const body = await response.json();
    if (response.ok) setRows((current) => current.map((row) => row.id === statId ? { ...row, verification_status: status } : row));
    else setNotice(body.error ?? "Decision could not be saved.");
    setBusyId(null);
  }

  return (
    <div>
      {notice ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{notice}</p> : null}
      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="p-4">Player</th><th className="p-4">Game</th><th className="p-4">Line</th><th className="p-4">Status</th><th className="p-4">Decision</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => <tr key={row.id}>
              <td className="p-4 font-semibold">{row.players?.full_name ?? "Player"}</td>
              <td className="p-4">vs {row.games?.opponent ?? "Opponent"}</td>
              <td className="p-4">{row.points} PTS · {row.rebounds} REB · {row.assists} AST</td>
              <td className="p-4"><StatBadge status={row.verification_status} /></td>
              <td className="p-4"><div className="flex flex-wrap gap-2">
                <Decision disabled={busyId === row.id} onClick={() => decide(row.id, "verified")}>Approve</Decision>
                <Decision disabled={busyId === row.id} onClick={() => decide(row.id, "needs_correction")}>Correct</Decision>
                <Decision disabled={busyId === row.id} onClick={() => decide(row.id, "rejected")}>Reject</Decision>
              </div></td>
            </tr>)}
            {!rows.length ? <tr><td colSpan={5} className="p-6 text-center text-muted">No stat submissions yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Decision({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="rounded-full border border-line px-3 py-1 text-xs font-bold disabled:opacity-50">{children}</button>;
}
