import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ videoId: z.string().uuid(), isHighlight: z.boolean(), order: z.number().int().min(0).max(100) });
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid highlight selection." }, { status: 400 });
  const { error } = await (await createClient()).rpc("set_video_highlight", { p_video_id: parsed.data.videoId, p_is_highlight: parsed.data.isHighlight, p_order: parsed.data.order });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}
