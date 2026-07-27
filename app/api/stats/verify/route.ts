import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  statId: z.string().uuid(),
  status: z.enum(["verified", "needs_correction", "rejected"]),
  confidence: z.enum(["High", "Medium", "Low"]),
  verifierNote: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification decision." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { error: updateError } = await supabase.from("stats").update({
    verification_status: parsed.data.status,
    confidence: parsed.data.confidence,
    updated_at: new Date().toISOString()
  }).eq("id", parsed.data.statId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  const { error: recordError } = await supabase.from("verification_records").insert({
    stat_id: parsed.data.statId,
    verified_by: userId,
    verification_source: "admin_review",
    confidence: parsed.data.confidence,
    final_status: parsed.data.status,
    admin_notes: parsed.data.verifierNote || null
  });
  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 400 });
  return NextResponse.json({ status: parsed.data.status });
}
