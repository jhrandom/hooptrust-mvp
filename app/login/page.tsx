export default function LoginPage() {
  return (
    <main className="container-page py-14">
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">HoopTrust</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Log in</h1>
        <form className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <input type="email" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="you@example.com" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Password
            <input type="password" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="••••••••" />
          </label>
          <button type="button" className="rounded-full bg-ink px-5 py-3 font-bold text-white">
            Log in to dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
