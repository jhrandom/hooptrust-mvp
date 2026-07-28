import Link from "next/link";
import { requestAccountDeletion } from "@/app/forms/actions";
import { PortalBackLink } from "@/components/PortalBackLink";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const auth = await requireProfileRole(["player", "guardian"], "/settings");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id, visibility").eq("user_id", auth!.userId).maybeSingle();
  const { data: contact } = player ? await supabase.from("player_contact_details").select("contact_name, relationship, consent_confirmed_at").eq("player_id", player.id).maybeSingle() : { data: null };
  const { data: deletion } = await supabase.from("deletion_requests").select("status, created_at").eq("user_id", auth!.userId).eq("status", "pending").maybeSingle();
  return <main className="container-page py-10"><PortalBackLink /><h1 className="text-3xl font-black text-ink">Privacy and account settings</h1>
    {params.error || params.message ? <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-semibold">{params.error ?? params.message}</p> : null}
    <section className="mt-8 rounded-3xl border border-line bg-white p-6"><h2 className="text-xl font-black">Profile privacy</h2><p className="mt-3 text-muted">Current visibility: <strong className="text-ink">{player?.visibility?.replaceAll("_", " ") ?? "No profile"}</strong></p><Link href="/profile" className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 font-bold text-white">Review visibility</Link></section>
    <section className="mt-6 rounded-3xl border border-line bg-white p-6"><h2 className="text-xl font-black">Designated-contact consent</h2><p className="mt-3 text-muted">{contact ? `Active for ${contact.contact_name} (${contact.relationship}).` : "No sharing consent is active."}</p><p className="mt-3 rounded-2xl bg-orange-50 p-4 text-sm text-muted">Never publish a minor athlete’s personal phone number, home address, private school records, or login information.</p><Link href="/profile" className="mt-4 inline-flex font-bold text-court">Manage designated contact</Link></section>
    <section className="mt-6 rounded-3xl border border-red-200 bg-white p-6"><h2 className="text-xl font-black text-red-800">Account and data deletion</h2>{deletion ? <p className="mt-3 text-sm font-bold text-red-700">Deletion request pending since {new Date(deletion.created_at).toLocaleString()}.</p> : <form action={requestAccountDeletion} className="mt-4"><textarea name="reason" maxLength={1000} placeholder="Optional reason" className="min-h-24 w-full rounded-2xl border border-line px-4 py-3" /><button className="mt-3 rounded-full bg-red-700 px-5 py-3 font-bold text-white">Request account and data deletion</button></form>}</section>
  </main>;
}
