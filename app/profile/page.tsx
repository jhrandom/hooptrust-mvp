import { savePlayerProfile } from "@/app/forms/actions";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">Player profile</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Build your recruiting profile</h1>
        <p className="mt-3 text-muted">Only information allowed by your visibility setting will be discoverable.</p>
        <Notice error={params.error} message={params.message} />
        <form action={savePlayerProfile} className="mt-8 grid gap-5 md:grid-cols-2">
          <Field label="Full name" name="fullName" required defaultValue={profile?.full_name} />
          <Field label="Preferred name" name="preferredName" defaultValue={profile?.preferred_name} />
          <Field label="School" name="school" defaultValue={profile?.school} />
          <Field label="Current team" name="currentTeam" defaultValue={profile?.current_team} />
          <Field label="Country" name="country" defaultValue={profile?.country} />
          <Field label="City" name="city" defaultValue={profile?.city} />
          <Field label="Graduation year" name="graduationYear" type="number" defaultValue={profile?.graduation_year} />
          <Field label="Birth year" name="birthYear" type="number" defaultValue={profile?.birth_year} />
          <Field label="Position" name="position" placeholder="PG / SG" defaultValue={profile?.position} />
          <Field label="Height" name="height" placeholder={'6\'1"'} defaultValue={profile?.height} />
          <Field label="Weight" name="weight" placeholder="165 lb" defaultValue={profile?.weight} />
          <Field label="Dominant hand" name="dominantHand" defaultValue={profile?.dominant_hand} />
          <Field label="Jersey number" name="jerseyNumber" type="number" defaultValue={profile?.jersey_number} />
          <Field label="GPA" name="gpa" defaultValue={profile?.gpa} />
          <Field label="Intended major" name="intendedMajor" defaultValue={profile?.intended_major} />
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
          <div className="flex items-end">
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
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="rounded-2xl border border-line px-4 py-3 font-normal" />
    </label>
  );
}

function Notice({ error, message }: { error?: string; message?: string }) {
  const text = error ?? message;
  if (!text) return null;
  return <p className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{text}</p>;
}
