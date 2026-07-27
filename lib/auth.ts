import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser(nextPath: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) {
    redirect(`/login?error=${encodeURIComponent("Log in to continue.")}&next=${encodeURIComponent(nextPath)}`);
  }
  return { userId, claims: data.claims };
}

export async function requireProfileRole(
  allowedRoles: Array<"player" | "guardian" | "team_coach" | "recruiter" | "admin">,
  nextPath: string
) {
  const auth = await requireAuthenticatedUser(nextPath);
  if (!auth || !isSupabaseConfigured()) return auth;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.userId)
    .single();

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    redirect("/?error=unauthorized");
  }
  return { ...auth, role: profile.role };
}
