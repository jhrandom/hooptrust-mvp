import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function PortalBackLink() {
  let destination = { href: "/", label: "Go back home" };
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (userId) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      destination =
        profile?.role === "recruiter"
          ? { href: "/dashboard/recruiter", label: "Go back to recruiter portal" }
          : profile?.role === "admin"
            ? { href: "/admin", label: "Go back to admin portal" }
            : { href: "/dashboard/player", label: "Go back to player portal" };
    }
  }
  return (
    <Link href={destination.href} className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted shadow-sm transition hover:border-slate-300 hover:text-ink">
      <ArrowLeft size={16} /> {destination.label}
    </Link>
  );
}
