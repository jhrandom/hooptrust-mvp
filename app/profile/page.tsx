import { savePlayerProfile } from "@/app/forms/actions";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalBackLink } from "@/components/PortalBackLink";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const auth = await requireProfileRole(["player", "guardian"], "/profile");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", auth!.userId)
    .maybeSingle();
  const { data: contact } = profile
    ? await supabase.from("player_contact_details").select("*").eq("player_id", profile.id).maybeSingle()
    : { data: null };

  return (
    <main className="container-page py-10">
      <PortalBackLink />
      <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">Player profile</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Build your recruiting profile</h1>
        <p className="mt-3 text-muted">Only information allowed by your visibility setting will be discoverable.</p>
        <Notice error={params.error} message={params.message} />
        <form action={savePlayerProfile} className="mt-8 grid gap-5 md:grid-cols-2">
          <Field label="Full name" name="fullName" required defaultValue={profile?.full_name} />
          <Field label="Preferred name" name="preferredName" defaultValue={profile?.preferred_name} />
          <Field label="School" name="school" required defaultValue={profile?.school} />
          <Field label="Current team" name="currentTeam" defaultValue={profile?.current_team} />
          <Field label="Country" name="country" required defaultValue={profile?.country} />
          <Field label="City" name="city" defaultValue={profile?.city} />
          <Field label="Graduation year" name="graduationYear" type="number" required defaultValue={profile?.graduation_year} />
          <Field label="Birth year" name="birthYear" type="number" required defaultValue={profile?.birth_year} />
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-semibold text-ink">
              Position <RequiredMark />
            </legend>
            <p className="mt-1 text-xs text-muted">Select every position you play.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {["PG", "SG", "SF", "PF", "C"].map((position) => {
                const selectedPositions = String(profile?.position ?? "").split("/").map((item) => item.trim());
                return (
                  <label key={position} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 py-3 font-bold text-ink transition has-[:checked]:border-court has-[:checked]:bg-orange-50">
                    <input name="position" type="checkbox" value={position} defaultChecked={selectedPositions.includes(position)} className="h-4 w-4 accent-orange-600" />
                    {position}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Field label="Height" name="height" required placeholder={'6\'1"'} defaultValue={profile?.height} />
          <Field label="Weight" name="weight" required placeholder="165 lb" defaultValue={profile?.weight} />
          <label className="grid gap-2 text-sm font-semibold text-ink">
            <span>Dominant hand <RequiredMark /></span>
            <select name="dominantHand" required defaultValue={profile?.dominant_hand ?? ""} className="rounded-2xl border border-line px-4 py-3 font-normal">
              <option value="" disabled>Select dominant hand</option>
              <option value="Right">Right</option>
              <option value="Left">Left</option>
              <option value="Both">Both / Ambidextrous</option>
            </select>
          </label>
          <Field label="Jersey number" name="jerseyNumber" type="number" defaultValue={profile?.jersey_number} />
          <Field label="GPA" name="gpa" defaultValue={profile?.gpa} />
          <Field label="Intended major" name="intendedMajor" defaultValue={profile?.intended_major} />
          <Field label="Profile photo URL" name="profilePhotoUrl" type="url" placeholder="https://…" defaultValue={profile?.profile_photo_url} />
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Recruiting status
            <select name="recruitingStatus" defaultValue={profile?.recruiting_status ?? "Open"} className="rounded-2xl border border-line px-4 py-3 font-normal">
              <option>Open</option><option>Contacted</option><option>Committed</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink md:col-span-2">
            Bio
            <textarea name="bio" maxLength={1000} defaultValue={profile?.bio ?? ""} className="min-h-32 rounded-2xl border border-line px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Visibility
            <select name="visibility" defaultValue={profile?.visibility ?? "private"} className="rounded-2xl border border-line px-4 py-3 font-normal">
              <option value="private">Private</option>
              <option value="recruiter_visible">Approved recruiters</option>
              <option value="public">Public</option>
            </select>
          </label>
          <section className="rounded-3xl border border-line bg-slate-50 p-5 md:col-span-2">
            <h2 className="text-lg font-black text-ink">Designated contact for approved recruiters</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              For minor athletes, use a parent, guardian, coach, or authorized representative. These details stay private unless you approve a recruiter’s request.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Contact name" name="contactName" defaultValue={contact?.contact_name} />
              <Field label="Relationship to player" name="relationship" placeholder="Parent / Guardian" defaultValue={contact?.relationship} />
              <Field label="Contact email" name="contactEmail" type="email" defaultValue={contact?.email} />
              <Field label="Contact phone (optional)" name="contactPhone" type="tel" defaultValue={contact?.phone} />
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-orange-200 bg-white p-4 text-sm leading-6 text-ink">
              <input name="consentToShare" type="checkbox" defaultChecked={Boolean(contact?.consent_confirmed_at)} className="mt-1 h-4 w-4 accent-orange-600" />
              <span>I confirm that this contact has permission to be shared only with recruiters whose contact request I explicitly approve.</span>
            </label>
          </section>
          <div className="flex items-end md:col-span-2">
            <button type="submit" className="w-full rounded-full bg-court px-5 py-3 font-bold text-white">Save profile</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", defaultValue, placeholder, required = false }: {
  label: string; name: string; type?: string; defaultValue?: string | number | null; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      <span>{label} {required ? <RequiredMark /> : null}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="rounded-2xl border border-line px-4 py-3 font-normal" />
    </label>
  );
}

function RequiredMark() {
  return <span className="text-red-600" aria-label="required">*</span>;
}

function Notice({ error, message }: { error?: string; message?: string }) {
  const text = error ?? message;
  if (!text) return null;
  return <p className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{text}</p>;
}
