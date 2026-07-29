"use client";

import { useState } from "react";
import { calculateExpectedPoints } from "@/lib/stat-validation";

const fields = [
  ["points", "Points"], ["rebounds", "Rebounds"], ["assists", "Assists"],
  ["steals", "Steals"], ["blocks", "Blocks"], ["turnovers", "Turnovers"],
  ["fga", "Field goal attempts"], ["fgm", "Field goals made"],
  ["tpa", "Three-point attempts"], ["tpm", "Three-pointers made"],
  ["fta", "Free throw attempts"], ["ftm", "Free throws made"], ["minutes", "Minutes"]
] as const;

export function StatSubmissionFields() {
  const [values, setValues] = useState<Record<string, string>>({});
  const expected = calculateExpectedPoints(values.fgm, values.tpm, values.ftm);
  const enteredPoints = toOptionalNumber(values.points);
  const mismatch = expected !== null && enteredPoints !== null && expected !== enteredPoints;

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">Your stat line</legend>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map(([name, label]) => (
          <label key={name} className="grid gap-1 text-xs font-semibold text-muted">
            {label}
            <input
              name={name}
              type="number"
              min="0"
              value={values[name] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
              className="rounded-xl border border-line px-3 py-2 text-ink"
            />
          </label>
        ))}
      </div>
      <div className={`mt-4 rounded-2xl border p-4 ${mismatch ? "border-orange-300 bg-orange-50" : "border-green-200 bg-green-50"}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Expected points</p>
        <p className="mt-1 text-2xl font-black text-ink">{expected ?? "—"}</p>
        <p className="mt-1 text-xs text-muted">Calculated as 2 × field goals made + three-pointers made + free throws made.</p>
        {mismatch ? <p className="mt-2 text-sm font-bold text-orange-800">Entered points ({enteredPoints}) do not match the calculated total ({expected}). The administrator can verify the final value.</p> : null}
      </div>
      <p className="mt-3 text-sm text-muted">
        Not sure about your exact stat? Leave the box empty, and we will check it for you.
      </p>
    </fieldset>
  );
}

function toOptionalNumber(value: string | number | null | undefined) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
