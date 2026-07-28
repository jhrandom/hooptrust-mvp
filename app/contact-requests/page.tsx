import { ContactDecisionList } from "@/components/DecisionList";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalBackLink } from "@/components/PortalBackLink";

export default async function ContactRequestsPage() {
  const auth = await requireAuthenticatedUser("/contact-requests");
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id").eq("user_id", auth!.userId).maybeSingle();
  const { data: requests } = player
    ? await supabase.from("contact_requests").select("id, message, status, recruiters(full_name, program)").eq("player_id", player.id).order("created_at", { ascending: false })
    : { data: [] };
  return <main className="container-page py-10"><PortalBackLink /><h1 className="text-3xl font-black text-ink">Contact requests</h1><p className="mt-2 text-muted">Review pending requests and your complete approval, decline, or revocation history.</p><div className="mt-8"><ContactDecisionList initialRows={(requests ?? []) as never[]} /></div></main>;
}
