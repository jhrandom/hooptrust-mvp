import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ eventKeys: z.array(z.string().min(1).max(200)).max(200) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification selection." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { error } = await supabase.from("notification_reads").upsert(
    parsed.data.eventKeys.map((eventKey) => ({ user_id: userId, event_key: eventKey, read_at: new Date().toISOString() })),
    { onConflict: "user_id,event_key" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ read: true });
}
