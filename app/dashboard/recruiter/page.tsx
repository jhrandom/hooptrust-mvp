import Link from "next/link";
import { Search } from "lucide-react";
import { submitRecruiterApplication } from "@/app/forms/actions";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function RecruiterDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; position?: string; year?: string; country?: string; error?: string; message?: string }>;
}) {
  const auth = await requireProfileRole(["recruiter", "admin"], "/dashboard/recruiter");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: recruiter } = await supabase.from("recruiters").select("*").eq("user_id", auth!.userId).maybeSingle();

  if (!recruiter || recruiter.status !== "approved") {
    return (
      <main className="container-page py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-court">Recruiter verification</p>
          <h1 className="mt-2 text-3xl font-black text-ink">
            {recruiter?.status === "pending" ? "Application under review" : "Apply for recruiter access"}
          </h1>
          <p className="mt-3 text-muted">Player discovery remains locked until an administrator verifies your organization.</p>
          <Notice error={params.error} message={params.message} />
          {recruiter?.status === "pending" ? (
            <p className="mt-6 rounded-2xl bg-orange-50 p-4 font-semibold text-muted">{recruiter.program} · {recruiter.email}</p>
          ) : (
            <form action={submitRecruiterApplication} className="mt-8 grid gap-5">
              <Field name="fullName" label="Full name" required />
              <Field name="program" label="College or organization" required />
              <Field name="title" label="Title" placeholder="Assistant Coach" />
              <Field name="email" label="Work email" type="email" required />
              <button type="submit" className="rounded-full bg-ink px-5 py-3 font-bold text-white">Submit application</button>
            </form>
          )}
        </div>
      </main>
    );
  }

  let query = supabase
    .from("players")
    .select("id, full_name, school, country, city, graduation_year, position, height, profile_photo_url, recruiting_status")
    .in("visibility", ["recruiter_visible", "public"])
    .order("created_at", { ascending: false });
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,school.ilike.%${params.q}%,country.ilike.%${params.q}%`);
  if (params.position) query = query.ilike("position", `%${params.position}%`);
  if (params.year && /^\d{4}$/.test(params.year)) query = query.eq("graduation_year", Number(params.year));
  if (params.country) query = query.ilike("country", params.country);
  const { data: players, error } = await query;

  return (
    <main className="container-page py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-court">Approved recruiter portal</p>
      <h1 className="mt-2 text-3xl font-black text-ink">Discover international players</h1>
      <Notice error={params.error ?? error?.message} message={params.message} />
      <form className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(3,1fr)_auto]">
          <label className="relative">
            <Search className="absolute left-4 top-3.5 text-muted" size={18} />
            <input name="q" defaultValue={params.q} className="w-full rounded-2xl border border-line py-3 pl-11 pr-4" placeholder="Player, school, or country" />
          </label>
          <input name="position" defaultValue={params.position} className="rounded-2xl border border-line px-4 py-3 text-sm" placeholder="Position" />
          <input name="year" type="number" defaultValue={params.year} className="rounded-2xl border border-line px-4 py-3 text-sm" placeholder="Grad year" />
          <input name="country" defaultValue={params.country} className="rounded-2xl border border-line px-4 py-3 text-sm" placeholder="Country" />
          <button type="submit" className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white">Apply filters</button>
        </div>
      </form>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {(players ?? []).map((player) => (
          <article key={player.id} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xl font-black text-ink">{player.full_name}</p>
            <p className="mt-2 text-sm text-muted">{player.position || "Position not provided"} · Class of {player.graduation_year || "—"}</p>
            <p className="mt-2 text-sm text-muted">{player.school || "School not provided"} · {[player.city, player.country].filter(Boolean).join(", ")}</p>
            <Link href={`/players/${player.id}`} className="mt-5 inline-flex rounded-full bg-court px-4 py-2 text-sm font-bold text-white">View profile</Link>
          </article>
        ))}
        {!players?.length ? <p className="text-muted">No players match these filters.</p> : null}
      </section>
    </main>
  );
}

function Field({ name, label, type = "text", placeholder, required = false }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-ink">{label}<input name={name} type={type} required={required} placeholder={placeholder} className="rounded-2xl border border-line px-4 py-3 font-normal" /></label>;
}

function Notice({ error, message }: { error?: string; message?: string }) {
  const text = error ?? message;
  return text ? <p className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{text}</p> : null;
}
