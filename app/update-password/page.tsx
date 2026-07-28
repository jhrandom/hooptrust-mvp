import { updatePassword } from "@/app/auth/actions";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="container-page py-14"><div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8"><h1 className="text-3xl font-black">Choose a new password</h1>{error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}<form action={updatePassword} className="mt-6 grid gap-4"><input name="password" type="password" minLength={10} required className="rounded-2xl border border-line px-4 py-3" /><button className="rounded-full bg-ink px-5 py-3 font-bold text-white">Update password</button></form></div></main>;
}
