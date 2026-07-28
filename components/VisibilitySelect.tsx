"use client";

import { useState } from "react";

export function VisibilitySelect({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      Visibility
      <select name="visibility" value={value} onChange={(event) => {
        const next = event.target.value;
        if (next === "private" && value !== "private" && !window.confirm("Make this profile private? Recruiters will no longer be able to discover it.")) return;
        setValue(next);
      }} className="rounded-2xl border border-line px-4 py-3 font-normal">
        <option value="private">Private</option>
        <option value="recruiter_visible">Approved recruiters</option>
        <option value="public">Public on the internet</option>
      </select>
    </label>
  );
}
