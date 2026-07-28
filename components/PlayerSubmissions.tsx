"use client";

import { useState } from "react";
import { StatBadge } from "./StatBadge";
import { calculateExpectedPoints } from "./StatSubmissionFields";

type Submission = {
  id: string;
  video_url: string | null;
  approval_status: string;
  review_notes: string | null;
  games: { opponent: string | null; game_date: string | null } | null;
  stats: Record<string, number | string | null> | null;
};

const statFields = ["jersey_number", "points", "rebounds", "assists", "steals", "blocks", "turnovers", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "minutes"];

export function PlayerSubmissions({ initialRows }: { initialRows: Submission[] }) {
  const [rows, setRows] = useState(initialRows);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>, row: Submission) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stats = Object.fromEntries(statFields.map((name) => {
      const raw = form.get(name);
      return [name, raw === "" || raw === null ? null : Number(raw)];
    }));
    const response = await fetch(`/api/player/submissions/${row.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: form.get("videoUrl"), stats })
    });
    const body = await response.json();
    setNotice(response.ok ? "Pending submission updated." : body.error);
  }

  async function withdraw(row: Submission) {
    if (!window.confirm("Withdraw this pending evidence submission? This cannot be undone.")) return;
    const response = await fetch(`/api/player/submissions/${row.id}`, { method: "DELETE" });
    const body = await response.json();
    if (response.ok) setRows((current) => current.filter((item) => item.id !== row.id));
    setNotice(response.ok ? "Submission withdrawn." : body.error);
  }

  return <div className="space-y-4">
    {notice ? <p className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-ink">{notice}</p> : null}
    {rows.map((row) => {
      const expected = calculateExpectedPoints(row.stats?.fgm as number | null, row.stats?.tpm as number | null, row.stats?.ftm as number | null);
      const pending = row.approval_status === "pending";
      return <article key={row.id} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap justify-between gap-3"><div><p className="font-black text-ink">{row.games?.opponent ? `vs ${row.games.opponent}` : "Game evidence"}</p><p className="text-sm text-muted">{row.games?.game_date}</p></div><StatBadge status={row.approval_status as never} /></div>
        {row.review_notes ? <p className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-muted"><span className="font-bold text-ink">Admin feedback:</span> {row.review_notes}</p> : null}
        <p className="mt-4 text-sm text-muted">Submitted: {row.stats?.points ?? "—"} PTS · {row.stats?.rebounds ?? "—"} REB · {row.stats?.assists ?? "—"} AST · Expected points {expected ?? "—"}</p>
        {pending ? <details className="mt-4 rounded-2xl border border-line p-4"><summary className="cursor-pointer font-bold text-ink">Edit or withdraw pending submission</summary>
          <form onSubmit={(event) => save(event, row)} className="mt-4">
            <label className="grid gap-1 text-sm font-bold text-ink">Video URL<input name="videoUrl" type="url" required defaultValue={row.video_url ?? ""} className="rounded-xl border border-line px-3 py-2 font-normal" /></label>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{statFields.map((name) => <label key={name} className="grid gap-1 text-xs font-bold capitalize text-muted">{name.replaceAll("_", " ")}<input name={name} type="number" min="0" defaultValue={row.stats?.[name] ?? ""} className="rounded-xl border border-line px-2 py-2 text-ink" /></label>)}</div>
            <div className="mt-4 flex gap-2"><button className="rounded-full bg-court px-4 py-2 text-sm font-bold text-white">Save changes</button><button type="button" onClick={() => withdraw(row)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Withdraw submission</button></div>
          </form>
        </details> : null}
      </article>;
    })}
    {!rows.length ? <p className="rounded-3xl border border-line bg-white p-6 text-muted">No submissions yet.</p> : null}
  </div>;
}
