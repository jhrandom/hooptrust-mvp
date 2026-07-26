import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRhythmRecommendation } from "@/lib/rhythm-data";

const RhythmPreviewSchema = z.object({
  situationId: z.enum(["pre-game", "training", "post-game"]),
  moodId: z.string().min(1),
  goalId: z.enum(["lock-in", "get-hyped", "calm-nerves", "push-intensity", "steady-rhythm", "recover", "reset"])
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RhythmPreviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid HoopTrust Rhythm request." }, { status: 400 });
  }

  const recommendation = getRhythmRecommendation(
    parsed.data.situationId,
    parsed.data.moodId,
    parsed.data.goalId
  );

  return NextResponse.json({
    status: "preview_only",
    message:
      "This endpoint returns the current mock recommendation. Replace this with Spotify OAuth and playlist creation in a later build.",
    recommendation
  });
}
