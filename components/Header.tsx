import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const publicNavItems = [
  { href: "/players/tyler-kim", label: "Sample Profile" },
  { href: "/rhythm", label: "Rhythm" }
];

export async function Header() {
  let signedIn = false;
  let portal = { href: "/dashboard/player", label: "Player Portal" };
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    signedIn = Boolean(userId);
    if (userId) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      if (profile?.role === "recruiter") portal = { href: "/dashboard/recruiter", label: "Recruiter Portal" };
      if (profile?.role === "admin") portal = { href: "/admin", label: "Admin Portal" };
    }
  }
  const navItems = signedIn ? [portal, ...publicNavItems] : publicNavItems;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
            <ShieldCheck size={20} />
          </span>
          HoopTrust
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        {signedIn ? (
          <div className="flex items-center gap-2">
            <Link href={portal.href} className="rounded-full bg-court px-4 py-2 text-sm font-semibold text-white shadow-sm md:hidden">
              Portal
            </Link>
            <form action={logout}>
              <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/signup" className="rounded-full bg-court px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
            Join Beta
          </Link>
        )}
      </div>
    </header>
  );
}
