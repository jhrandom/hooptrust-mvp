"use client";

import { useState } from "react";

export type NotificationItem = { key: string; date: string; title: string; body: string; read: boolean };

export function NotificationCenter({ initialItems }: { initialItems: NotificationItem[] }) {
  const [items, setItems] = useState(initialItems);
  async function markRead(keys: string[]) {
    const response = await fetch("/api/player/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventKeys: keys }) });
    if (response.ok) setItems((current) => current.map((item) => keys.includes(item.key) ? { ...item, read: true } : item));
  }
  const unread = items.filter((item) => !item.read);
  return <div>
    {unread.length ? <button type="button" onClick={() => markRead(unread.map((item) => item.key))} className="mb-4 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Mark all as read</button> : null}
    <div className="space-y-3">{items.map((item) => <article key={item.key} className={`rounded-3xl border p-5 ${item.read ? "border-line bg-white" : "border-orange-300 bg-orange-50"}`}><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black text-ink">{item.title}</p><p className="mt-2 text-sm text-muted">{item.body}</p><p className="mt-2 text-xs text-muted">{new Date(item.date).toLocaleString()}</p></div>{!item.read ? <button type="button" onClick={() => markRead([item.key])} className="text-sm font-bold text-court">Mark read</button> : null}</div></article>)}{!items.length ? <p className="text-muted">No notifications yet.</p> : null}</div>
  </div>;
}
