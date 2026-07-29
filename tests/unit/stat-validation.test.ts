import { describe, expect, it } from "vitest";
import { calculateExpectedPoints, getStatConsistencyError } from "@/lib/stat-validation";

describe("basketball stat validation", () => {
  it("calculates points with three-pointers counted only once beyond field goals", () => {
    expect(calculateExpectedPoints(8, 3, 4)).toBe(23);
    expect(calculateExpectedPoints("8", "3", "4")).toBe(23);
  });

  it("does not invent a total when a shooting value is missing or invalid", () => {
    expect(calculateExpectedPoints(8, null, 4)).toBeNull();
    expect(calculateExpectedPoints("", 3, 4)).toBeNull();
    expect(calculateExpectedPoints("invalid", 3, 4)).toBeNull();
  });

  it.each([
    [{ fgm: 6, fga: 5 }, "Field goals made cannot exceed attempts."],
    [{ tpm: 4, tpa: 3 }, "Three-pointers made cannot exceed attempts."],
    [{ ftm: 8, fta: 7 }, "Free throws made cannot exceed attempts."],
    [{ fgm: 3, tpm: 4 }, "Three-pointers made cannot exceed total field goals made."],
    [{ points: 20, fgm: 6, tpm: 2, ftm: 3 }, "Points must equal the shooting total (17)."]
  ])("rejects inconsistent values", (stats, expected) => {
    expect(getStatConsistencyError(stats)).toBe(expected);
  });

  it("accepts a consistent line and ignores absent optional values", () => {
    expect(getStatConsistencyError({ points: 17, fgm: 6, fga: 12, tpm: 2, tpa: 5, ftm: 3, fta: 4 })).toBeNull();
    expect(getStatConsistencyError({ rebounds: 10 })).toBeNull();
    expect(getStatConsistencyError({ points: Number.NaN })).toBeNull();
  });
});
