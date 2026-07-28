import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordAdminAction } from "@/lib/admin-audit";

const schema = z.object({
  recruiterId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().trim().max(1000).optional()
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid recruiter decision." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { data, error } = await supabase.from("recruiters").update({
    status: parsed.data.status,
    verification_notes: parsed.data.notes || null,
    verified_at: parsed.data.status === "approved" ? new Date().toISOString() : null,
    verification_expires_at: parsed.data.status === "approved" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
  }).eq("id", parsed.data.recruiterId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Recruiter not found." }, { status: 404 });
  await recordAdminAction(supabase, userId, `recruiter_${parsed.data.status}`, "recruiter", data.id, {
    notes: parsed.data.notes
  });
  return NextResponse.json({ status: parsed.data.status });
}
