import { describe, expect, it } from "vitest";
import { getRhythmRecommendation, rhythmSituations } from "@/lib/rhythm-data";

describe("Rhythm recommendations", () => {
  it("defines unique situations with selectable moods and goals", () => {
    expect(new Set(rhythmSituations.map((item) => item.id)).size).toBe(3);
    for (const situation of rhythmSituations) {
      expect(situation.moods.length).toBeGreaterThan(0);
      expect(situation.goals.length).toBeGreaterThan(0);
    }
  });

  it("selects recovery, steady training, hype, and focus programs", () => {
    expect(getRhythmRecommendation("post-game", "frustrated", "reset")).toMatchObject({ bpmRange: "60–95 BPM" });
    expect(getRhythmRecommendation("training", "focused", "steady-rhythm").playlistName).toContain("Training Rhythm");
    expect(getRhythmRecommendation("pre-game", "low-energy", "get-hyped").bpmRange).toBe("120–155 BPM");
    expect(getRhythmRecommendation("pre-game", "confident", "lock-in").bpmRange).toBe("85–120 BPM");
  });

  it("always supplies searchable track seeds and Spotify actions", () => {
    const results = [
      getRhythmRecommendation("post-game", "happy", "recover"),
      getRhythmRecommendation("training", "tired", "push-intensity"),
      getRhythmRecommendation("pre-game", "nervous", "calm-nerves")
    ];
    for (const result of results) {
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.tracks.every((track) => track.spotifySearchQuery.length > 0)).toBe(true);
      expect(result.spotifyActions.length).toBeGreaterThan(0);
    }
  });
});
