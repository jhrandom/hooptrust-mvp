"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalText = (max: number) =>
  z.preprocess((value) => value === "" ? null : value, z.string().trim().max(max).nullable());

const optionalStat = (max: number) =>
  z.preprocess(
    (value) => value === "" || value === null ? null : value,
    z.coerce.number().int().min(0).max(max).nullable()
  );

const playerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  preferredName: optionalText(50),
  school: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  city: optionalText(80),
  graduationYear: z.coerce.number().int().min(2020).max(2040),
  birthYear: z.coerce.number().int().min(1980).max(new Date().getFullYear()),
  position: z.string().trim().min(1).max(40),
  height: z.string().trim().min(1).max(30),
  weight: z.string().trim().min(1).max(30),
  dominantHand: z.enum(["Right", "Left", "Both"]),
  currentTeam: optionalText(120),
  jerseyNumber: z.coerce.number().int().min(0).max(999).nullable(),
  bio: optionalText(1000),
  gpa: optionalText(30),
  intendedMajor: optionalText(100),
  recruitingStatus: z.enum(["Open", "Contacted", "Committed"]),
  visibility: z.enum(["private", "recruiter_visible", "public"])
});

const evidenceSchema = z.object({
  videoUrl: z.string().url().max(2000),
  gameDate: z.string().date(),
  opponent: optionalText(120),
  location: optionalText(150),
  tournament: optionalText(150),
  finalScore: optionalText(40),
  jerseyNumber: z.coerce.number().int().min(0).max(999),
  points: optionalStat(300),
  rebounds: optionalStat(100),
  assists: optionalStat(100),
  steals: optionalStat(100),
  blocks: optionalStat(100),
  turnovers: optionalStat(100),
  minutes: optionalStat(200),
  fga: optionalStat(300),
  fgm: optionalStat(300),
  tpa: optionalStat(300),
  tpm: optionalStat(300),
  fta: optionalStat(300),
  ftm: optionalStat(300)
});

const recruiterSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  program: z.string().trim().min(2).max(150),
  title: optionalText(100),
  email: z.string().email().max(320)
});

const contactDetailsSchema = z.object({
  contactName: z.string().trim().min(2).max(100),
  relationship: z.string().trim().min(2).max(60),
  contactEmail: z.string().email().max(320),
  contactPhone: optionalText(50)
});

function value(formData: FormData, key: string) {
  return formData.get(key);
}

function optionalNumberValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return raw === null || raw === "" ? null : raw;
}

function withNotice(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

async function authenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login?error=Log%20in%20to%20continue.");
  return { supabase, userId };
}

async function requireRole(allowed: string[]) {
  const context = await authenticatedContext();
  const { data: profile } = await context.supabase.from("profiles").select("role").eq("id", context.userId).maybeSingle();
  if (!profile || !allowed.includes(profile.role)) redirect("/?error=unauthorized");
  return context;
}

export async function savePlayerProfile(formData: FormData) {
  const parsed = playerSchema.safeParse({
    fullName: value(formData, "fullName"),
    preferredName: value(formData, "preferredName"),
    school: value(formData, "school"),
    country: value(formData, "country"),
    city: value(formData, "city"),
    graduationYear: optionalNumberValue(formData, "graduationYear"),
    birthYear: optionalNumberValue(formData, "birthYear"),
    position: formData.getAll("position").map(String).join(" / "),
    height: value(formData, "height"),
    weight: value(formData, "weight"),
    dominantHand: value(formData, "dominantHand"),
    currentTeam: value(formData, "currentTeam"),
    jerseyNumber: optionalNumberValue(formData, "jerseyNumber"),
    bio: value(formData, "bio"),
    gpa: value(formData, "gpa"),
    intendedMajor: value(formData, "intendedMajor"),
    recruitingStatus: value(formData, "recruitingStatus"),
    visibility: value(formData, "visibility")
  });
  if (!parsed.success) withNotice("/profile", "error", "Check the highlighted profile information and try again.");

  const { supabase, userId } = await requireRole(["player", "guardian"]);
  const profile = parsed.data;
  const { data: savedPlayer, error } = await supabase.from("players").upsert({
    user_id: userId,
    full_name: profile.fullName,
    preferred_name: profile.preferredName,
    school: profile.school,
    country: profile.country,
    city: profile.city,
    graduation_year: profile.graduationYear,
    birth_year: profile.birthYear,
    position: profile.position,
    height: profile.height,
    weight: profile.weight,
    dominant_hand: profile.dominantHand,
    current_team: profile.currentTeam,
    jersey_number: profile.jerseyNumber,
    bio: profile.bio,
    gpa: profile.gpa,
    intended_major: profile.intendedMajor,
    recruiting_status: profile.recruitingStatus,
    visibility: profile.visibility,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" }).select("id").single();

  if (error) withNotice("/profile", "error", error.message);
  const consentToShare = formData.get("consentToShare") === "on";
  if (consentToShare) {
    const contact = contactDetailsSchema.safeParse({
      contactName: value(formData, "contactName"),
      relationship: value(formData, "relationship"),
      contactEmail: value(formData, "contactEmail"),
      contactPhone: value(formData, "contactPhone")
    });
    if (!contact.success) {
      withNotice("/profile", "error", "Complete the designated contact name, relationship, and valid email before enabling contact sharing.");
    }
    const { error: contactError } = await supabase.from("player_contact_details").upsert({
      player_id: savedPlayer.id,
      contact_name: contact.data.contactName,
      relationship: contact.data.relationship,
      email: contact.data.contactEmail,
      phone: contact.data.contactPhone,
      consent_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (contactError) withNotice("/profile", "error", contactError.message);
  } else {
    const { error: contactError } = await supabase.from("player_contact_details").delete().eq("player_id", savedPlayer.id);
    if (contactError) withNotice("/profile", "error", contactError.message);
  }
  revalidatePath("/profile");
  revalidatePath("/dashboard/player");
  withNotice("/profile", "message", "Player profile saved.");
}

export async function submitEvidence(formData: FormData) {
  const parsed = evidenceSchema.safeParse({
    videoUrl: value(formData, "videoUrl"),
    gameDate: value(formData, "gameDate"),
    opponent: value(formData, "opponent"),
    location: value(formData, "location"),
    tournament: value(formData, "tournament"),
    finalScore: value(formData, "finalScore"),
    jerseyNumber: value(formData, "jerseyNumber"),
    points: value(formData, "points"),
    rebounds: value(formData, "rebounds"),
    assists: value(formData, "assists"),
    steals: value(formData, "steals"),
    blocks: value(formData, "blocks"),
    turnovers: value(formData, "turnovers"),
    minutes: value(formData, "minutes"),
    fga: value(formData, "fga"),
    fgm: value(formData, "fgm"),
    tpa: value(formData, "tpa"),
    tpm: value(formData, "tpm"),
    fta: value(formData, "fta"),
    ftm: value(formData, "ftm")
  });
  if (!parsed.success) withNotice("/upload", "error", "Enter a valid video URL, game date, and jersey number.");

  const { supabase, userId } = await requireRole(["player", "guardian"]);
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) withNotice("/profile", "error", "Create your player profile before submitting game evidence.");

  const { data: game, error: gameError } = await supabase.from("games").insert({
    submitted_by: userId,
    opponent: parsed.data.opponent,
    game_date: parsed.data.gameDate,
    location: parsed.data.location,
    final_score: parsed.data.finalScore,
    tournament: parsed.data.tournament,
    approval_status: "pending"
  }).select("id").single();
  if (gameError) withNotice("/upload", "error", gameError.message);

  const { error: videoError } = await supabase.from("videos").insert({
    uploaded_by: userId,
    player_id: player.id,
    game_id: game.id,
    video_url: parsed.data.videoUrl,
    visibility: "private",
    approval_status: "pending"
  });
  if (videoError) withNotice("/upload", "error", videoError.message);

  const { error: statsError } = await supabase.from("stats").insert({
    player_id: player.id,
    game_id: game.id,
    jersey_number: parsed.data.jerseyNumber,
    points: parsed.data.points,
    rebounds: parsed.data.rebounds,
    assists: parsed.data.assists,
    steals: parsed.data.steals,
    blocks: parsed.data.blocks,
    turnovers: parsed.data.turnovers,
    minutes: parsed.data.minutes,
    fga: parsed.data.fga,
    fgm: parsed.data.fgm,
    tpa: parsed.data.tpa,
    tpm: parsed.data.tpm,
    fta: parsed.data.fta,
    ftm: parsed.data.ftm,
    source: "manual",
    verification_status: "pending",
    confidence: "Medium"
  });
  if (statsError) withNotice("/upload", "error", statsError.message);

  revalidatePath("/dashboard/player");
  withNotice("/upload", "message", "Game evidence submitted for review.");
}

export async function submitRecruiterApplication(formData: FormData) {
  const parsed = recruiterSchema.safeParse({
    fullName: value(formData, "fullName"),
    program: value(formData, "program"),
    title: value(formData, "title"),
    email: value(formData, "email")
  });
  if (!parsed.success) withNotice("/dashboard/recruiter", "error", "Complete the recruiter application with a valid email.");

  const { supabase, userId } = await requireRole(["recruiter"]);
  const { error } = await supabase.from("recruiters").upsert({
    user_id: userId,
    full_name: parsed.data.fullName,
    program: parsed.data.program,
    title: parsed.data.title,
    email: parsed.data.email,
    status: "pending"
  }, { onConflict: "user_id" });
  if (error) withNotice("/dashboard/recruiter", "error", error.message);

  revalidatePath("/dashboard/recruiter");
  withNotice("/dashboard/recruiter", "message", "Application submitted. An administrator must approve it.");
}
