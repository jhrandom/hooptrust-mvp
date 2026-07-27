import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="container-page py-14">
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">Beta access</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Create your HoopTrust account</h1>
        <p className="mt-3 text-muted">
          Create a secure account with Supabase Auth. Recruiter accounts remain pending until an administrator approves them.
        </p>
        {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
        {!configured ? <p className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-muted">Replace the placeholder Supabase URL and publishable key in .env.local with the real values from your Supabase project.</p> : null}
        <form action={signup} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Full name
            <input name="fullName" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="Juhyun Tyler Kim" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <input name="email" type="email" autoComplete="email" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="you@example.com" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Password
            <input name="password" type="password" minLength={8} autoComplete="new-password" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="At least 8 characters" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Account type
            <select name="role" className="rounded-2xl border border-line px-4 py-3 font-normal">
              <option value="player">Player</option>
              <option value="guardian">Parent / Guardian</option>
              <option value="team_coach">Team Coach</option>
              <option value="recruiter">College Recruiter</option>
            </select>
          </label>
          <button type="submit" disabled={!configured} className="rounded-full bg-court px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Create account
          </button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Already have a prototype account? <Link href="/login" className="font-semibold text-court">Log in</Link>
        </p>
      </div>
    </main>
  );
}
