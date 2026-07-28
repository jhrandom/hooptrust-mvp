import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return <main className="container-page py-14"><div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8"><h1 className="text-3xl font-black">Reset password</h1>{params.error || params.message ? <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm">{params.error ?? params.message}</p> : null}<form action={requestPasswordReset} className="mt-6 grid gap-4"><input name="email" type="email" required placeholder="you@example.com" className="rounded-2xl border border-line px-4 py-3" /><button className="rounded-full bg-ink px-5 py-3 font-bold text-white">Send reset email</button></form></div></main>;
}
