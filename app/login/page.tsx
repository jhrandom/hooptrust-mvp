import Link from "next/link";
import { login } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="container-page py-14">
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">HoopTrust</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Log in</h1>
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}
        {params.message ? <Notice tone="success">{params.message}</Notice> : null}
        {!configured ? <Notice tone="error">Replace the placeholder Supabase URL and publishable key in .env.local with the real values from your Supabase project.</Notice> : null}
        <form action={login} className="mt-8 grid gap-5">
          <input type="hidden" name="next" value={params.next ?? ""} />
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <input name="email" type="email" autoComplete="email" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="you@example.com" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Password
            <input name="password" type="password" minLength={8} autoComplete="current-password" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="••••••••" />
          </label>
          <button type="submit" disabled={!configured} className="rounded-full bg-ink px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Log in to dashboard
          </button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Need an account? <Link href="/signup" className="font-semibold text-court">Create one</Link>
        </p>
        <p className="mt-2 text-sm"><Link href="/forgot-password" className="font-semibold text-court">Forgot password?</Link></p>
      </div>
    </main>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <p className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
      tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
    }`}>
      {children}
    </p>
  );
}
