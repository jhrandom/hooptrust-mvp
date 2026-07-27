"use client";

import { useState } from "react";

export type AdminContactRow = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  recruiters: { full_name: string; program: string; email: string } | null;
  players: { full_name: string } | null;
};

export function AdminContactOversight({ initialRows }: { initialRows: AdminContactRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function update(requestId: string, status: "pending" | "revoked") {
    setBusy(requestId);
    setError(null);
    const response = await fetch("/api/admin/contact-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status })
    });
    const body = await response.json().catch(() => null);
    if (response.ok) setRows((current) => current.map((row) => row.id === requestId ? { ...row, status } : row));
    else setError(body?.error ?? "Contact access could not be updated.");
    setBusy(null);
  }

  return (
    <div>
      {error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-bold text-ink">{row.recruiters?.full_name ?? "Recruiter"} → {row.players?.full_name ?? "Player"}</p><p className="text-sm text-muted">{row.recruiters?.program}</p></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-muted">{row.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{row.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.status === "approved" ? <button type="button" disabled={busy === row.id} onClick={() => update(row.id, "revoked")} className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">Revoke access</button> : null}
              {row.status === "revoked" ? <button type="button" disabled={busy === row.id} onClick={() => update(row.id, "pending")} className="rounded-full border border-line px-3 py-2 text-xs font-bold text-ink disabled:opacity-50">Return to pending</button> : null}
            </div>
          </article>
        ))}
        {!rows.length ? <p className="text-sm text-muted">No contact requests exist.</p> : null}
      </div>
    </div>
  );
}
