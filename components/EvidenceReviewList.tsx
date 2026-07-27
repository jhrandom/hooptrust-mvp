"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

export type EvidenceRow = {
  id: string;
  video_url: string | null;
  approval_status: string | null;
  created_at: string;
  players: { full_name: string } | null;
  games: { opponent: string | null; game_date: string | null; tournament: string | null } | null;
};

export function EvidenceReviewList({ initialRows }: { initialRows: EvidenceRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(videoId: string, status: "approved" | "rejected") {
    setBusy(videoId);
    setError(null);
    try {
      const response = await fetch("/api/videos/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, status })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "The decision could not be saved.");
      setRows((current) => current.map((row) => row.id === videoId ? { ...row, approval_status: status } : row));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The decision could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-black text-ink">{row.players?.full_name ?? "Player"}</p>
              <p className="mt-1 text-sm text-muted">
                {row.games?.opponent ? `vs ${row.games.opponent}` : "Opponent not provided"}
                {row.games?.game_date ? ` · ${row.games.game_date}` : ""}
                {row.games?.tournament ? ` · ${row.games.tournament}` : ""}
              </p>
            </div>
            <Status value={row.approval_status ?? "pending"} />
          </div>
          {row.video_url ? (
            <a href={row.video_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              Open submitted video <ExternalLink size={16} />
            </a>
          ) : <p className="mt-5 text-sm text-red-700">No video URL was stored.</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={busy === row.id} onClick={() => decide(row.id, "approved")} className="rounded-full border border-green-300 px-4 py-2 text-sm font-bold text-green-800 disabled:opacity-50">Approve evidence</button>
            <button type="button" disabled={busy === row.id} onClick={() => decide(row.id, "rejected")} className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">Reject</button>
          </div>
        </article>
      ))}
      {!rows.length ? <p className="rounded-3xl border border-line bg-white p-6 text-muted">No video evidence has been submitted.</p> : null}
    </div>
  );
}

function Status({ value }: { value: string }) {
  const style = value === "approved" ? "bg-green-100 text-green-800" : value === "rejected" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-800";
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${style}`}>{value}</span>;
}
