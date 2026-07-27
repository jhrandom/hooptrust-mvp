import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordAdminAction } from "@/lib/admin-audit";

const schema = z.object({
  videoId: z.string().uuid(),
  status: z.enum(["approved", "rejected"])
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid evidence decision." }, { status: 400 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { data: video, error } = await supabase
    .from("videos")
    .update({ approval_status: parsed.data.status })
    .eq("id", parsed.data.videoId)
    .select("id, game_id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!video) return NextResponse.json({ error: "Evidence submission not found." }, { status: 404 });

  if (video.game_id) {
    const { error: gameError } = await supabase
      .from("games")
      .update({ approval_status: parsed.data.status })
      .eq("id", video.game_id);
    if (gameError) return NextResponse.json({ error: gameError.message }, { status: 400 });
  }

  await recordAdminAction(supabase, userId, `evidence_${parsed.data.status}`, "video", video.id, {
    game_id: video.game_id
  });
  return NextResponse.json({ status: parsed.data.status });
}
