type StatValues = Record<string, unknown>;

export function getStatConsistencyError(stats: StatValues) {
  for (const [made, attempted, label] of [
    ["fgm", "fga", "Field goals"],
    ["tpm", "tpa", "Three-pointers"],
    ["ftm", "fta", "Free throws"]
  ] as const) {
    const madeValue = numeric(stats[made]);
    const attemptedValue = numeric(stats[attempted]);
    if (madeValue !== null && attemptedValue !== null && madeValue > attemptedValue) {
      return `${label} made cannot exceed attempts.`;
    }
  }
  const points = numeric(stats.points);
  const fgm = numeric(stats.fgm);
  const tpm = numeric(stats.tpm);
  const ftm = numeric(stats.ftm);
  if (tpm !== null && fgm !== null && tpm > fgm) {
    return "Three-pointers made cannot exceed total field goals made.";
  }
  if (points !== null && fgm !== null && tpm !== null && ftm !== null) {
    const expected = (2 * fgm) + tpm + ftm;
    if (points !== expected) return `Points must equal the shooting total (${expected}).`;
  }
  return null;
}

export function calculateExpectedPoints(
  fgm: string | number | null | undefined,
  tpm: string | number | null | undefined,
  ftm: string | number | null | undefined
) {
  const fieldGoals = optionalNumber(fgm);
  const threes = optionalNumber(tpm);
  const freeThrows = optionalNumber(ftm);
  if (fieldGoals === null || threes === null || freeThrows === null) return null;
  return (2 * fieldGoals) + threes + freeThrows;
}

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optionalNumber(value: string | number | null | undefined) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
