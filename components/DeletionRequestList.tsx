"use client";

import { useState } from "react";

type Row = { id: string; reason: string | null; status: string; created_at: string; profiles: { full_name: string } | null };

export function DeletionRequestList({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  async function decide(id: string, status: "approved" | "rejected") {
    const response = await fetch("/api/admin/deletion-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, status }) });
    if (response.ok) setRows((current) => status === "rejected" ? current.filter((row) => row.id !== id) : current.map((row) => row.id === id ? { ...row, status } : row));
    else window.alert((await response.json()).error);
  }
  async function permanentlyDelete(id: string) {
    if (!window.confirm("Permanently delete this account, authentication identity, files, and linked data? This cannot be undone.")) return;
    const response = await fetch("/api/admin/deletion-requests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, confirmation: "DELETE" }) });
    if (response.ok) setRows((current) => current.filter((row) => row.id !== id));
    else window.alert((await response.json()).error);
  }
  return <div className="space-y-3">{rows.map((row) => <article key={row.id} className="rounded-2xl border border-line p-4"><p className="font-bold text-ink">{row.profiles?.full_name ?? "User"}</p><p className="mt-1 text-xs text-muted">{new Date(row.created_at).toLocaleString()} · {row.status}</p><p className="mt-2 text-sm text-muted">{row.reason || "No reason provided."}</p><div className="mt-3 flex gap-2">{row.status === "pending" ? <><button onClick={() => decide(row.id, "approved")} className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Approve for deletion</button><button onClick={() => decide(row.id, "rejected")} className="rounded-full border border-line px-3 py-2 text-xs font-bold">Reject</button></> : <button onClick={() => permanentlyDelete(row.id)} className="rounded-full bg-red-700 px-3 py-2 text-xs font-bold text-white">Permanently delete account</button>}</div></article>)}{!rows.length ? <p className="text-sm text-muted">No deletion requests awaiting action.</p> : null}</div>;
}
