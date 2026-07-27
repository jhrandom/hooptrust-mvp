"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(["player", "guardian", "team_coach", "recruiter"])
});

function authRedirect(path: string, type: "error" | "message", text: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(text)}`);
}

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) {
    authRedirect("/login", "error", "Supabase is not configured yet.");
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined
  });
  if (!parsed.success) {
    authRedirect("/login", "error", "Enter a valid email and a password of at least 8 characters.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });
  if (error) authRedirect("/login", "error", error.message);

  if (parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//")) {
    redirect(parsed.data.next);
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = profile?.role ?? data.user.user_metadata?.role;
  if (role === "recruiter") redirect("/dashboard/recruiter");
  if (role === "admin") redirect("/admin");
  redirect("/dashboard/player");
}

export async function signup(formData: FormData) {
  if (!isSupabaseConfigured()) {
    authRedirect("/signup", "error", "Supabase is not configured yet.");
  }

  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role")
  });
  if (!parsed.success) {
    authRedirect("/signup", "error", "Complete every field and use a password of at least 8 characters.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!siteUrl) {
    authRedirect("/signup", "error", "NEXT_PUBLIC_SITE_URL is not configured.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: siteUrl,
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role
      }
    }
  });
  if (error) authRedirect("/signup", "error", error.message);

  if (data.session) {
    if (parsed.data.role === "recruiter") redirect("/dashboard/recruiter");
    redirect("/dashboard/player");
  }
  authRedirect("/login", "message", "Check your email to confirm your account, then log in.");
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
