import { PortalBackLink } from "@/components/PortalBackLink";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationCenter } from "@/components/NotificationCenter";

export default async function NotificationsPage() {
  const auth = await requireProfileRole(["player", "guardian"], "/notifications");
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id").eq("user_id", auth!.userId).maybeSingle();
  const [{ data: videos }, { data: requests }] = player ? await Promise.all([
    supabase.from("videos").select("id, approval_status, review_notes, reviewed_at, created_at").eq("player_id", player.id).order("created_at", { ascending: false }),
    supabase.from("contact_requests").select("id, status, created_at, decided_at, recruiters(full_name, program)").eq("player_id", player.id).order("created_at", { ascending: false })
  ]) : [{ data: [] }, { data: [] }];
  const { data: reads } = await supabase.from("notification_reads").select("event_key").eq("user_id", auth!.userId);
  const readKeys = new Set((reads ?? []).map((row) => row.event_key));
  const items = [
    ...(videos ?? []).map((video) => ({ key: `video:${video.id}:${video.approval_status}`, date: video.reviewed_at ?? video.created_at, title: video.approval_status === "pending" ? "Evidence awaiting review" : `Evidence ${video.approval_status}`, body: video.review_notes ?? "Your submission status changed." })),
    ...(requests ?? []).map((request) => { const recruiter = Array.isArray(request.recruiters) ? request.recruiters[0] : request.recruiters; return { key: `contact:${request.id}:${request.status}`, date: request.decided_at ?? request.created_at, title: `Contact request: ${request.status}`, body: `${recruiter?.full_name ?? "A recruiter"} · ${recruiter?.program ?? ""}` }; })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return <main className="container-page py-10"><PortalBackLink /><h1 className="text-3xl font-black text-ink">Notifications</h1><p className="mt-2 text-muted">Evidence decisions, feedback, and recruiter-request activity.</p><div className="mt-8"><NotificationCenter initialItems={items.map((item) => ({ ...item, read: readKeys.has(item.key) }))} /></div></main>;
}
