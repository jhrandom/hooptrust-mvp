import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="container-page py-14">
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">Beta access</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Create your HoopTrust account</h1>
        <p className="mt-3 text-muted">
          This MVP screen is wired as a form shell. Connect it to Supabase Auth during backend integration.
        </p>
        <form className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Full name
            <input className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="Juhyun Tyler Kim" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <input type="email" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="you@example.com" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Account type
            <select className="rounded-2xl border border-line px-4 py-3 font-normal">
              <option>Player</option>
              <option>Parent / Guardian</option>
              <option>Team Coach</option>
              <option>College Recruiter</option>
            </select>
          </label>
          <button type="button" className="rounded-full bg-court px-5 py-3 font-bold text-white">
            Save beta application
          </button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Already have a prototype account? <Link href="/login" className="font-semibold text-court">Log in</Link>
        </p>
      </div>
    </main>
  );
}
