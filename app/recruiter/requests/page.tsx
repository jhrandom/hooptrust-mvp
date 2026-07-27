import { Mail, ShieldCheck } from "lucide-react";
import { PortalBackLink } from "@/components/PortalBackLink";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function RecruiterRequestsPage() {
  const auth = await requireProfileRole(["recruiter", "admin"], "/recruiter/requests");
  const supabase = await createClient();
  const { data: recruiter } = await supabase.from("recruiters").select("id, status").eq("user_id", auth!.userId).maybeSingle();
  const { data: requests, error } = recruiter
    ? await supabase
        .from("contact_requests")
        .select("id, message, status, created_at, decided_at, players(id, full_name, player_contact_details(contact_name, relationship, email, phone, consent_confirmed_at))")
        .eq("recruiter_id", recruiter.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <main className="container-page py-10">
      <PortalBackLink />
      <p className="text-sm font-bold uppercase tracking-wide text-court">Recruiter communication</p>
      <h1 className="mt-2 text-3xl font-black text-ink">Contact requests</h1>
      <p className="mt-2 text-muted">Approved contact details appear here only after the player or representative grants permission.</p>
      {error ? <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error.message}</p> : null}
      <div className="mt-8 space-y-5">
        {(requests ?? []).map((request) => {
          const player = Array.isArray(request.players) ? request.players[0] : request.players;
          const rawContact = player?.player_contact_details;
          const contact = Array.isArray(rawContact) ? rawContact[0] : rawContact;
          return (
            <article key={request.id} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-ink">{player?.full_name ?? "Player"}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{request.message}</p>
                </div>
                <Status status={request.status} />
              </div>
              {request.status === "approved" && contact ? (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                  <p className="flex items-center gap-2 font-black text-green-800"><ShieldCheck size={18} /> Designated contact</p>
                  <p className="mt-3 font-bold text-ink">{contact.contact_name} · {contact.relationship}</p>
                  <a href={`mailto:${contact.email}`} className="mt-2 flex items-center gap-2 text-sm font-semibold text-court"><Mail size={15} /> {contact.email}</a>
                  {contact.phone ? <a href={`tel:${contact.phone}`} className="mt-2 block text-sm font-semibold text-ink">{contact.phone}</a> : null}
                </div>
              ) : request.status === "approved" ? (
                <p className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm font-semibold text-muted">The request was approved, but no active designated contact is available. The player may have withdrawn sharing consent.</p>
              ) : null}
            </article>
          );
        })}
        {!requests?.length ? <p className="rounded-3xl border border-line bg-white p-6 text-muted">No contact requests have been submitted.</p> : null}
      </div>
    </main>
  );
}

function Status({ status }: { status: string }) {
  const style = status === "approved" ? "bg-green-100 text-green-800" : status === "declined" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-800";
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${style}`}>{status}</span>;
}
