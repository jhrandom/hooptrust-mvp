import Link from "next/link";

export function Footer() {
  return <footer className="border-t border-line bg-white"><div className="container-page flex flex-wrap justify-between gap-4 py-8 text-sm text-muted"><p>© 2026 HoopTrust</p><nav className="flex gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/safety">Minor safety</Link></nav></div></footer>;
}
