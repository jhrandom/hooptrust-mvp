import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/players/tyler-kim", label: "Sample Profile" },
  { href: "/dashboard/recruiter", label: "Recruiter Portal" },
  { href: "/rhythm", label: "Rhythm" },
  { href: "/verify-stats", label: "Verify Stats" },
  { href: "/admin", label: "Admin" }
];

export function Header() {
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
        <Link
          href="/signup"
          className="rounded-full bg-court px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Join Beta
        </Link>
      </div>
    </header>
  );
}
