import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAction } from "@/lib/admin-audit";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["pending", "approved", "declined", "revoked"])
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid contact-access decision." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { data, error } = await supabase.from("contact_requests").update({
    status: parsed.data.status,
    decided_at: parsed.data.status === "pending" ? null : new Date().toISOString()
  }).eq("id", parsed.data.requestId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Contact request not found." }, { status: 404 });
  await recordAdminAction(supabase, userId, `contact_access_${parsed.data.status}`, "contact_request", data.id);
  return NextResponse.json({ status: parsed.data.status });
}
