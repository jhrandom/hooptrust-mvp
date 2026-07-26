import { NextResponse } from "next/server";
import { z } from "zod";

const VerifyStatSchema = z.object({
  statId: z.string().min(1),
  status: z.enum(["verified", "needs_correction", "rejected"]),
  confidence: z.enum(["High", "Medium", "Low"]),
  verifierNote: z.string().max(1000).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = VerifyStatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification update", details: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: Update Supabase stats table and insert a verification_records row.
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    ...parsed.data
  });
}
