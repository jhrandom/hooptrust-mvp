import { addScheduleEvent, deleteScheduleEvent } from "@/app/forms/actions";
import { PortalBackLink } from "@/components/PortalBackLink";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const auth = await requireProfileRole(["player", "guardian"], "/schedule");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("id").eq("user_id", auth!.userId).maybeSingle();
  const { data: events } = player ? await supabase.from("player_schedule").select("*").eq("player_id", player.id).order("event_date") : { data: [] };
  return <main className="container-page py-10"><PortalBackLink /><h1 className="text-3xl font-black text-ink">Upcoming schedule</h1><p className="mt-2 text-muted">Share future games, showcases, camps, and tournaments with approved recruiters.</p>
    {params.error || params.message ? <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-semibold">{params.error ?? params.message}</p> : null}
    <form action={addScheduleEvent} className="mt-8 grid gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm md:grid-cols-2">
      <Field name="eventName" label="Event name" required placeholder="Summer Showcase" />
      <Field name="eventDate" label="Date and time" type="datetime-local" required />
      <Field name="opponent" label="Opponent (optional)" />
      <Field name="location" label="Location" />
      <label className="grid gap-2 text-sm font-bold md:col-span-2">Notes<textarea name="notes" maxLength={500} className="min-h-20 rounded-2xl border border-line px-4 py-3 font-normal" /></label>
      <button className="rounded-full bg-court px-5 py-3 font-bold text-white md:col-span-2">Add event</button>
    </form>
    <div className="mt-8 space-y-3">{(events ?? []).map((event) => <article key={event.id} className="flex flex-wrap justify-between gap-4 rounded-3xl border border-line bg-white p-5"><div><p className="font-black text-ink">{event.event_name}</p><p className="mt-1 text-sm text-muted">{new Date(event.event_date).toLocaleString()} · {event.location || "Location TBD"}</p>{event.opponent ? <p className="mt-1 text-sm text-muted">vs {event.opponent}</p> : null}</div><form action={deleteScheduleEvent}><input type="hidden" name="id" value={event.id} /><button className="text-sm font-bold text-red-700">Remove</button></form></article>)}</div>
  </main>;
}

function Field({ name, label, type = "text", required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="grid gap-2 text-sm font-bold">{label}{required ? " *" : ""}<input name={name} type={type} required={required} placeholder={placeholder} className="rounded-2xl border border-line px-4 py-3 font-normal" /></label>;
}
