import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAction } from "@/lib/admin-audit";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const schema = z.object({ requestId: z.string().uuid(), status: z.enum(["approved", "rejected"]) });

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid deletion-request decision." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { data, error } = await supabase.from("deletion_requests").update({ status: parsed.data.status, resolved_at: new Date().toISOString() }).eq("id", parsed.data.requestId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  await recordAdminAction(supabase, userId, `deletion_request_${parsed.data.status}`, "deletion_request", data.id);
  return NextResponse.json({ status: parsed.data.status });
}

export async function DELETE(request: Request) {
  const parsed = z.object({ requestId: z.string().uuid(), confirmation: z.literal("DELETE") }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Explicit deletion confirmation required." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const adminId = claims?.claims?.sub;
  if (!adminId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", adminId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { data: deletion } = await supabase.from("deletion_requests").select("id, user_id, status").eq("id", parsed.data.requestId).maybeSingle();
  if (!deletion || deletion.status !== "approved") return NextResponse.json({ error: "Approve the request before permanent deletion." }, { status: 409 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Server deletion credentials are not configured." }, { status: 503 });
  await recordAdminAction(supabase, adminId, "account_permanently_deleted", "user", deletion.user_id, { deletion_request_id: deletion.id });
  const admin = createAdminClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: files } = await admin.storage.from("profile-photos").list(deletion.user_id);
  if (files?.length) await admin.storage.from("profile-photos").remove(files.map((file) => `${deletion.user_id}/${file.name}`));
  const { error } = await admin.auth.admin.deleteUser(deletion.user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
