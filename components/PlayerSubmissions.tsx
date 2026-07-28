"use client";

import { useState } from "react";
import { StatBadge } from "./StatBadge";
import { calculateExpectedPoints } from "./StatSubmissionFields";

type Submission = {
  id: string;
  video_url: string | null;
  approval_status: string;
  review_notes: string | null;
  is_highlight: boolean;
  highlight_order: number | null;
  games: { opponent: string | null; game_date: string | null } | null;
  stats: (Record<string, unknown> & { submitted_values?: Record<string, number | null> | null }) | null;
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

  async function saveHighlight(row: Submission, isHighlight: boolean, order = row.highlight_order ?? 0) {
    const response = await fetch("/api/player/highlights", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: row.id, isHighlight, order })
    });
    if (response.ok) {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_highlight: isHighlight, highlight_order: order } : item));
      setNotice(isHighlight ? "Highlight order saved." : "Removed from highlights.");
    }
    else setNotice((await response.json()).error);
  }

  return <div className="space-y-4">
    {notice ? <p className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-ink">{notice}</p> : null}
    {rows.map((row) => {
      const expected = calculateExpectedPoints(row.stats?.fgm as number | null, row.stats?.tpm as number | null, row.stats?.ftm as number | null);
      const pending = row.approval_status === "pending";
      const submitted = row.stats?.submitted_values;
      const changes = submitted ? statFields.filter((name) => submitted[name] !== row.stats?.[name]) : [];
      return <article key={row.id} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap justify-between gap-3"><div><p className="font-black text-ink">{row.games?.opponent ? `vs ${row.games.opponent}` : "Game evidence"}</p><p className="text-sm text-muted">{row.games?.game_date}</p></div><StatBadge status={row.approval_status as never} /></div>
        {row.review_notes ? <p className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-muted"><span className="font-bold text-ink">Admin feedback:</span> {row.review_notes}</p> : null}
        <p className="mt-4 text-sm text-muted">Submitted: {display(row.stats?.points)} PTS · {display(row.stats?.rebounds)} REB · {display(row.stats?.assists)} AST · Expected points {expected ?? "—"}</p>
        {changes.length ? <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4"><p className="text-sm font-bold text-ink">Administrator corrections</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{changes.map((name) => <p key={name} className="text-xs text-muted"><span className="font-bold uppercase">{name.replaceAll("_", " ")}</span>: {submitted?.[name] ?? "—"} → <span className="font-bold text-ink">{String(row.stats?.[name] ?? "—")}</span></p>)}</div></div> : null}
        {pending ? <details className="mt-4 rounded-2xl border border-line p-4"><summary className="cursor-pointer font-bold text-ink">Edit or withdraw pending submission</summary>
          <form onSubmit={(event) => save(event, row)} className="mt-4">
            <label className="grid gap-1 text-sm font-bold text-ink">Video URL<input name="videoUrl" type="url" required defaultValue={row.video_url ?? ""} className="rounded-xl border border-line px-3 py-2 font-normal" /></label>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{statFields.map((name) => <label key={name} className="grid gap-1 text-xs font-bold capitalize text-muted">{name.replaceAll("_", " ")}<input name={name} type="number" min="0" defaultValue={inputValue(row.stats?.[name])} className="rounded-xl border border-line px-2 py-2 text-ink" /></label>)}</div>
            <div className="mt-4 flex gap-2"><button className="rounded-full bg-court px-4 py-2 text-sm font-bold text-white">Save changes</button><button type="button" onClick={() => withdraw(row)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Withdraw submission</button></div>
          </form>
        </details> : null}
        {row.approval_status === "approved" ? <div className="mt-4 flex flex-wrap items-end gap-2">
          {row.is_highlight ? <label className="grid gap-1 text-xs font-bold text-muted">Highlight order
            <input type="number" min="0" max="100" defaultValue={row.highlight_order ?? 0} onBlur={(event) => saveHighlight(row, true, Number(event.currentTarget.value))} className="w-24 rounded-xl border border-line px-3 py-2 text-ink" />
          </label> : null}
          <button type="button" onClick={() => saveHighlight(row, !row.is_highlight)} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink">{row.is_highlight ? "Remove from highlights" : "Add to highlights"}</button>
        </div> : null}
      </article>;
    })}
    {!rows.length ? <p className="rounded-3xl border border-line bg-white p-6 text-muted">No submissions yet.</p> : null}
  </div>;
}

function display(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? value : "—";
}

function inputValue(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? value : "";
}
