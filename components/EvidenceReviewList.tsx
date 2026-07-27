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
  stats: {
    jersey_number: number | null;
    points: number | null;
    rebounds: number | null;
    assists: number | null;
    steals: number | null;
    blocks: number | null;
    turnovers: number | null;
    fgm: number | null;
    fga: number | null;
    tpm: number | null;
    tpa: number | null;
    ftm: number | null;
    fta: number | null;
    minutes: number | null;
    verification_status: string | null;
  } | null;
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
      {rows.filter((row) => (row.approval_status ?? "pending") === "pending").map((row) => (
        <EvidenceCard key={row.id} row={row} busy={busy === row.id} onDecision={decide} onStatsSaved={(stats) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, stats } : item))} />
      ))}
      {!rows.some((row) => (row.approval_status ?? "pending") === "pending") ? <p className="rounded-3xl border border-line bg-white p-6 text-muted">No evidence is awaiting review.</p> : null}

      <details className="rounded-3xl border border-line bg-slate-50 p-5">
        <summary className="cursor-pointer font-black text-ink">
          Reviewed evidence archive ({rows.filter((row) => row.approval_status === "approved" || row.approval_status === "rejected").length})
        </summary>
        <div className="mt-5 space-y-4">
          {rows.filter((row) => row.approval_status === "approved" || row.approval_status === "rejected").map((row) => (
            <EvidenceCard key={row.id} row={row} busy={false} onDecision={decide} onStatsSaved={(stats) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, stats } : item))} />
          ))}
          {!rows.some((row) => row.approval_status === "approved" || row.approval_status === "rejected") ? <p className="text-sm text-muted">No reviewed evidence yet.</p> : null}
        </div>
      </details>
    </div>
  );
}

function EvidenceCard({ row, busy, onDecision, onStatsSaved }: {
  row: EvidenceRow;
  busy: boolean;
  onDecision: (videoId: string, status: "approved" | "rejected") => void;
  onStatsSaved: (stats: NonNullable<EvidenceRow["stats"]>) => void;
}) {
  const pending = (row.approval_status ?? "pending") === "pending";
  return (
    <article className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-black text-ink">{row.players?.full_name ?? "Player"}{row.stats?.jersey_number !== null && row.stats?.jersey_number !== undefined ? ` · #${row.stats.jersey_number}` : ""}</p>
          <p className="mt-1 text-sm text-muted">
            {row.games?.opponent ? `vs ${row.games.opponent}` : "Opponent not provided"}
            {row.games?.game_date ? ` · ${row.games.game_date}` : ""}
            {row.games?.tournament ? ` · ${row.games.tournament}` : ""}
          </p>
        </div>
        <Status value={row.approval_status ?? "pending"} />
      </div>
      <StatGrid stats={row.stats} />
      <ManualStatsEditor videoId={row.id} stats={row.stats} onSaved={onStatsSaved} />
      {row.video_url ? (
        <a href={row.video_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
          Open submitted video <ExternalLink size={16} />
        </a>
      ) : <p className="mt-5 text-sm text-red-700">No video URL was stored.</p>}
      {pending ? <div className="mt-4 flex gap-2">
        <button type="button" disabled={busy} onClick={() => onDecision(row.id, "approved")} className="rounded-full border border-green-300 px-4 py-2 text-sm font-bold text-green-800 disabled:opacity-50">Approve evidence</button>
        <button type="button" disabled={busy} onClick={() => onDecision(row.id, "rejected")} className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">Reject</button>
      </div> : null}
    </article>
  );
}

function ManualStatsEditor({ videoId, stats, onSaved }: {
  videoId: string;
  stats: EvidenceRow["stats"];
  onSaved: (stats: NonNullable<EvidenceRow["stats"]>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fields: Array<[keyof NonNullable<EvidenceRow["stats"]>, string, number]> = [
    ["jersey_number", "Jersey", 999], ["points", "Points", 300], ["rebounds", "Rebounds", 100],
    ["assists", "Assists", 100], ["steals", "Steals", 100], ["blocks", "Blocks", 100],
    ["turnovers", "Turnovers", 100], ["fgm", "FG made", 300], ["fga", "FG attempts", 300],
    ["tpm", "3PT made", 300], ["tpa", "3PT attempts", 300], ["ftm", "FT made", 300],
    ["fta", "FT attempts", 300], ["minutes", "Minutes", 200]
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map(([name]) => {
      const raw = formData.get(name);
      return [name, raw === null || raw === "" ? null : Number(raw)];
    }));
    try {
      const response = await fetch("/api/stats/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, stats: values })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Statistics could not be saved.");
      onSaved(body.stats);
      setNotice("Reviewed statistics saved and verified.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Statistics could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mt-5 rounded-2xl border border-line p-4">
      <summary className="cursor-pointer font-bold text-ink">Register or correct stats manually</summary>
      <form onSubmit={submit} className="mt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {fields.map(([name, label, max]) => (
            <label key={name} className="grid gap-1 text-xs font-bold text-muted">
              {label}
              <input name={name} type="number" min="0" max={max} defaultValue={stats?.[name] ?? ""} className="rounded-xl border border-line px-3 py-2 text-ink" />
            </label>
          ))}
        </div>
        <button type="submit" disabled={saving} className="mt-4 rounded-full bg-court px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
          {saving ? "Saving…" : "Save and verify stats"}
        </button>
        {notice ? <p className="mt-3 text-sm font-semibold text-muted">{notice}</p> : null}
      </form>
    </details>
  );
}

function StatGrid({ stats }: { stats: EvidenceRow["stats"] }) {
  if (!stats) return <p className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm text-muted">No stat line is linked to this video.</p>;
  const items = [
    ["PTS", stats.points], ["REB", stats.rebounds], ["AST", stats.assists],
    ["STL", stats.steals], ["BLK", stats.blocks], ["TO", stats.turnovers],
    ["FG", shooting(stats.fgm, stats.fga)], ["3PT", shooting(stats.tpm, stats.tpa)],
    ["FT", shooting(stats.ftm, stats.fta)], ["MIN", stats.minutes]
  ] as const;
  return <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{items.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3 text-center"><p className="text-xs font-bold text-muted">{label}</p><p className="mt-1 font-black text-ink">{value ?? "—"}</p></div>)}</div>;
}

function shooting(made: number | null, attempted: number | null) {
  if (made === null && attempted === null) return "—";
  return `${made ?? "—"}/${attempted ?? "—"}`;
}

function Status({ value }: { value: string }) {
  const style = value === "approved" ? "bg-green-100 text-green-800" : value === "rejected" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-800";
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${style}`}>{value}</span>;
}
