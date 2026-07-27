"use client";

import { useState } from "react";
import { MailPlus } from "lucide-react";

export function RecruiterActions({ playerId }: { playerId: string }) {
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestContact() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, message })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setMessage("");
      setNotice("Contact request submitted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function savePlayer() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/saved-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setNotice("Player saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder="Explain why you would like to connect…" className="mt-5 min-h-24 w-full rounded-2xl border border-line px-4 py-3 text-sm" />
      <button type="button" disabled={busy || message.trim().length < 10} onClick={requestContact} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-court px-4 py-3 font-bold text-white disabled:opacity-50">
        <MailPlus size={18} /> Request contact
      </button>
      <button type="button" disabled={busy} onClick={savePlayer} className="mt-3 w-full rounded-full border border-line bg-white px-4 py-3 font-bold text-ink disabled:opacity-50">Save player</button>
      {notice ? <p className="mt-3 text-sm font-semibold text-muted">{notice}</p> : null}
    </div>
  );
}
