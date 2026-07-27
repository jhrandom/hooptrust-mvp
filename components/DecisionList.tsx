"use client";

import { useState } from "react";

type RecruiterRow = { id: string; full_name: string; program: string; email: string; status: string };
type ContactRow = { id: string; message: string; status: string; recruiters: { full_name: string; program: string } | null };

export function RecruiterApprovalList({ initialRows }: { initialRows: RecruiterRow[] }) {
  const [rows, setRows] = useState(initialRows);
  return <DecisionRows rows={rows} empty="No pending recruiter applications." render={(row) => (
    <div key={row.id} className="rounded-2xl border border-line p-4">
      <p className="font-bold text-ink">{row.full_name}</p><p className="text-sm text-muted">{row.program} · {row.email}</p>
      <div className="mt-3 flex gap-2"><Action onClick={() => decide("/api/recruiters", { recruiterId: row.id, status: "approved" }, () => setRows((all) => all.filter((item) => item.id !== row.id)))}>Approve</Action><Action onClick={() => decide("/api/recruiters", { recruiterId: row.id, status: "rejected" }, () => setRows((all) => all.filter((item) => item.id !== row.id)))}>Reject</Action></div>
    </div>
  )} />;
}

export function ContactDecisionList({ initialRows }: { initialRows: ContactRow[] }) {
  const [rows, setRows] = useState(initialRows);
  return <DecisionRows rows={rows} empty="No pending contact requests." render={(row) => (
    <div key={row.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="font-bold text-ink">{row.recruiters?.full_name ?? "Recruiter"} · {row.recruiters?.program}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{row.message}</p>
      <div className="mt-4 flex gap-2"><Action onClick={() => decide("/api/contact-requests", { requestId: row.id, status: "approved" }, () => setRows((all) => all.filter((item) => item.id !== row.id)))}>Approve</Action><Action onClick={() => decide("/api/contact-requests", { requestId: row.id, status: "declined" }, () => setRows((all) => all.filter((item) => item.id !== row.id)))}>Decline</Action></div>
    </div>
  )} />;
}

function DecisionRows<T>({ rows, render, empty }: { rows: T[]; render: (row: T) => React.ReactNode; empty: string }) {
  return <div className="space-y-3">{rows.map(render)}{!rows.length ? <p className="text-sm text-muted">{empty}</p> : null}</div>;
}

function Action(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink" />;
}

async function decide(url: string, body: object, success: () => void) {
  const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (response.ok) success();
  else {
    const result = await response.json().catch(() => null);
    window.alert(result?.error ?? "The decision could not be saved.");
  }
}
