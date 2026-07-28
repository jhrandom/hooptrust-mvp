"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStatConsistencyError } from "@/lib/stat-validation";
import { validateEvidenceUrl } from "@/lib/media-url";

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
  heightCm: z.coerce.number().min(100).max(260),
  weightKg: z.coerce.number().min(30).max(250),
  dominantHand: z.enum(["Right", "Left", "Both"]),
  currentTeam: optionalText(120),
  jerseyNumber: z.coerce.number().int().min(0).max(999).nullable(),
  bio: optionalText(1000),
  gpa: optionalText(30),
  intendedMajor: optionalText(100),
  profilePhotoUrl: z.preprocess((value) => value === "" ? null : value, z.string().url().max(2000).nullable()),
  recruitingStatus: z.enum(["Open", "Contacted", "Committed"]),
  visibility: z.enum(["private", "recruiter_visible", "public"])
});

const evidenceSchema = z.object({
  videoUrl: z.string().url().max(2000),
  gameDate: z.string().date(),
  opponent: optionalText(120),
  teamName: optionalText(120),
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
  email: z.string().email().max(320),
  organizationWebsite: z.string().url().max(2000),
  supportingDocumentUrl: z.preprocess((value) => value === "" ? null : value, z.string().url().max(2000).nullable())
});

const contactDetailsSchema = z.object({
  contactName: z.string().trim().min(2).max(100),
  relationship: z.string().trim().min(2).max(60),
  contactEmail: z.string().email().max(320),
  contactPhone: optionalText(50)
});

const scheduleSchema = z.object({
  eventName: z.string().trim().min(2).max(150),
  opponent: optionalText(120),
  eventDate: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value))).transform((value) => new Date(value).toISOString()),
  location: optionalText(150),
  notes: optionalText(500),
  timezone: z.string().trim().min(1).max(100)
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
    heightCm: value(formData, "heightCm"),
    weightKg: value(formData, "weightKg"),
    dominantHand: value(formData, "dominantHand"),
    currentTeam: value(formData, "currentTeam"),
    jerseyNumber: optionalNumberValue(formData, "jerseyNumber"),
    bio: value(formData, "bio"),
    gpa: value(formData, "gpa"),
    intendedMajor: value(formData, "intendedMajor"),
    profilePhotoUrl: value(formData, "profilePhotoUrl"),
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
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    dominant_hand: profile.dominantHand,
    current_team: profile.currentTeam,
    jersey_number: profile.jerseyNumber,
    bio: profile.bio,
    gpa: profile.gpa,
    intended_major: profile.intendedMajor,
    profile_photo_url: profile.profilePhotoUrl,
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
    teamName: value(formData, "teamName"),
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
  const videoUrlError = validateEvidenceUrl(parsed.data.videoUrl);
  if (videoUrlError) withNotice("/upload", "error", videoUrlError);
  const statError = getStatConsistencyError(parsed.data);
  if (statError) withNotice("/upload", "error", statError);

  const { supabase, userId } = await requireRole(["player", "guardian"]);
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) withNotice("/profile", "error", "Create your player profile before submitting game evidence.");
  const submittedStats = {
    jersey_number: parsed.data.jerseyNumber, points: parsed.data.points, rebounds: parsed.data.rebounds,
    assists: parsed.data.assists, steals: parsed.data.steals, blocks: parsed.data.blocks,
    turnovers: parsed.data.turnovers, minutes: parsed.data.minutes, fga: parsed.data.fga,
    fgm: parsed.data.fgm, tpa: parsed.data.tpa, tpm: parsed.data.tpm, fta: parsed.data.fta, ftm: parsed.data.ftm
  };
  const { data: allowed } = await supabase.rpc("consume_rate_limit", { p_bucket: "evidence_upload", p_limit: 10, p_window_seconds: 3600 });
  if (!allowed) withNotice("/upload", "error", "Too many submissions. Try again later.");
  const { error: submissionError } = await supabase.rpc("submit_game_evidence", {
    p_video_url: parsed.data.videoUrl, p_game_date: parsed.data.gameDate,
    p_opponent: parsed.data.opponent, p_team_name: parsed.data.teamName,
    p_location: parsed.data.location, p_tournament: parsed.data.tournament,
    p_final_score: parsed.data.finalScore, p_stats: submittedStats
  });
  if (submissionError) withNotice("/upload", "error", submissionError.message);

  revalidatePath("/dashboard/player");
  withNotice("/upload", "message", "Game evidence submitted for review.");
}

export async function submitRecruiterApplication(formData: FormData) {
  const parsed = recruiterSchema.safeParse({
    fullName: value(formData, "fullName"),
    program: value(formData, "program"),
    title: value(formData, "title"),
    email: value(formData, "email"),
    organizationWebsite: value(formData, "organizationWebsite"),
    supportingDocumentUrl: value(formData, "supportingDocumentUrl")
  });
  if (!parsed.success) withNotice("/dashboard/recruiter", "error", "Complete the recruiter application with a valid email.");

  const { supabase, userId } = await requireRole(["recruiter"]);
  const { error } = await supabase.from("recruiters").upsert({
    user_id: userId,
    full_name: parsed.data.fullName,
    program: parsed.data.program,
    title: parsed.data.title,
    email: parsed.data.email,
    institutional_email: parsed.data.email,
    organization_website: parsed.data.organizationWebsite,
    supporting_document_url: parsed.data.supportingDocumentUrl,
    status: "pending"
  }, { onConflict: "user_id" });
  if (error) withNotice("/dashboard/recruiter", "error", error.message);

  revalidatePath("/dashboard/recruiter");
  withNotice("/dashboard/recruiter", "message", "Application submitted. An administrator must approve it.");
}

export async function addScheduleEvent(formData: FormData) {
  const parsed = scheduleSchema.safeParse({
    eventName: value(formData, "eventName"),
    opponent: value(formData, "opponent"),
    eventDate: value(formData, "eventDate"),
    location: value(formData, "location"),
    notes: value(formData, "notes"),
    timezone: value(formData, "timezone")
  });
  if (!parsed.success) withNotice("/schedule", "error", "Enter an event name and valid date.");
  const { supabase, userId } = await requireRole(["player", "guardian"]);
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) withNotice("/profile", "error", "Create your player profile first.");
  const { error } = await supabase.from("player_schedule").insert({
    player_id: player.id,
    event_name: parsed.data.eventName,
    opponent: parsed.data.opponent,
    event_date: parsed.data.eventDate,
    location: parsed.data.location,
    notes: parsed.data.notes,
    timezone: parsed.data.timezone
  });
  if (error) withNotice("/schedule", "error", error.message);
  revalidatePath("/schedule");
  revalidatePath("/dashboard/player");
  withNotice("/schedule", "message", "Schedule event added.");
}

export async function deleteScheduleEvent(formData: FormData) {
  const id = z.string().uuid().safeParse(value(formData, "id"));
  if (!id.success) withNotice("/schedule", "error", "Invalid schedule event.");
  const { supabase } = await requireRole(["player", "guardian"]);
  const { error } = await supabase.from("player_schedule").delete().eq("id", id.data);
  if (error) withNotice("/schedule", "error", error.message);
  revalidatePath("/schedule");
  redirect("/schedule");
}

export async function requestAccountDeletion(formData: FormData) {
  const reason = z.string().trim().max(1000).safeParse(value(formData, "reason") || "");
  if (!reason.success) withNotice("/settings", "error", "Deletion reason is too long.");
  const { supabase, userId } = await authenticatedContext();
  const { data: existing } = await supabase.from("deletion_requests").select("id").eq("user_id", userId).eq("status", "pending").maybeSingle();
  if (existing) withNotice("/settings", "message", "A deletion request is already pending.");
  const { error } = await supabase.from("deletion_requests").insert({ user_id: userId, reason: reason.data || null });
  if (error) withNotice("/settings", "error", error.message);
  withNotice("/settings", "message", "Account and data deletion request submitted.");
}

export async function linkGuardian(formData: FormData) {
  const email = z.string().email().safeParse(value(formData, "guardianEmail"));
  if (!email.success) withNotice("/profile", "error", "Enter the guardian account email.");
  const { supabase, userId } = await requireRole(["player"]);
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) withNotice("/profile", "error", "Create the player profile first.");
  const { error } = await supabase.rpc("link_guardian_by_email", { p_player_id: player.id, p_email: email.data });
  if (error) withNotice("/profile", "error", error.message);
  withNotice("/profile", "message", "Guardian account linked.");
}

export async function addCoachReference(formData: FormData) {
  const parsed = z.object({
    coachName: z.string().trim().min(2).max(100), organization: optionalText(150),
    email: z.string().email(), relationship: optionalText(100), consent: z.literal("on")
  }).safeParse({ coachName: value(formData, "coachName"), organization: value(formData, "coachOrganization"), email: value(formData, "coachEmail"), relationship: value(formData, "coachRelationship"), consent: value(formData, "coachConsent") });
  if (!parsed.success) withNotice("/profile", "error", "Complete the coach reference and confirm consent.");
  const { supabase, userId } = await requireRole(["player", "guardian"]);
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) withNotice("/profile", "error", "Create the player profile first.");
  const { error } = await supabase.from("coach_references").insert({ player_id: player.id, coach_name: parsed.data.coachName, organization: parsed.data.organization, email: parsed.data.email, relationship: parsed.data.relationship, consent_confirmed: true });
  if (error) withNotice("/profile", "error", error.message);
  withNotice("/profile", "message", "Coach reference added.");
}

export async function addPlayerTeam(formData: FormData) {
  const parsed = z.object({ teamName: z.string().trim().min(2).max(150), season: z.string().trim().min(2).max(50), role: optionalText(100) }).safeParse({ teamName: value(formData, "teamName"), season: value(formData, "season"), role: value(formData, "teamRole") });
  if (!parsed.success) withNotice("/profile", "error", "Enter a team and season.");
  const { supabase, userId } = await requireRole(["player", "guardian"]);
  const { data: player } = await supabase.from("players").select("id").eq("user_id", userId).maybeSingle();
  if (!player) withNotice("/profile", "error", "Create the player profile first.");
  const { error } = await supabase.from("player_teams").insert({ player_id: player.id, team_name: parsed.data.teamName, season: parsed.data.season, role: parsed.data.role });
  if (error) withNotice("/profile", "error", error.message);
  withNotice("/profile", "message", "Team season added.");
}
