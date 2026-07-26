export type UserRole = "player" | "guardian" | "team_coach" | "recruiter" | "admin";
export type VerificationStatus = "not_submitted" | "pending" | "verified" | "needs_correction" | "rejected";
export type RecruiterStatus = "pending" | "approved" | "rejected";
export type ProfileVisibility = "private" | "link_only" | "recruiter_visible" | "public";

export type Player = {
  id: string;
  fullName: string;
  preferredName: string;
  school: string;
  country: string;
  city: string;
  graduationYear: number;
  age: number;
  position: string;
  height: string;
  weight: string;
  dominantHand: "Right" | "Left" | "Both";
  team: string;
  jerseyNumber: number;
  bio: string;
  gpa?: string;
  intendedMajor?: string;
  recruitingStatus: "Open" | "Contacted" | "Committed";
  visibility: ProfileVisibility;
  profilePhotoUrl?: string;
  verificationScore: number;
};

export type Game = {
  id: string;
  date: string;
  opponent: string;
  teamName: string;
  location: string;
  finalScore: string;
  tournament: string;
  videoUrl: string;
  approvalStatus: "pending" | "approved" | "rejected";
};

export type StatLine = {
  id: string;
  playerId: string;
  gameId: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  minutes: number;
  source: "manual" | "coach_sheet" | "ai_partner" | "tournament_record";
  verificationStatus: VerificationStatus;
  confidence: "High" | "Medium" | "Low";
  verifierNote?: string;
};

export type Recruiter = {
  id: string;
  fullName: string;
  program: string;
  title: string;
  email: string;
  status: RecruiterStatus;
  savedPlayerIds: string[];
};

export type ContactRequest = {
  id: string;
  recruiterId: string;
  playerId: string;
  message: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
};
