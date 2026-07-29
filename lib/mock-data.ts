import type { ContactRequest, Game, Player, Recruiter, StatLine } from "./types";

export const players: Player[] = [
  {
    id: "tyler-kim",
    fullName: "Juhyun Tyler Kim",
    preferredName: "Tyler",
    school: "St. Johnsbury Academy Jeju",
    country: "South Korea",
    city: "Jeju",
    graduationYear: 2027,
    age: 17,
    position: "SG / PG",
    height: "6'1\"",
    weight: "165 lb",
    dominantHand: "Right",
    team: "SJA Jeju Varsity",
    jerseyNumber: 11,
    bio: "International student-athlete seeking U.S. college basketball exposure through verified game footage and performance data.",
    gpa: "Available upon request",
    intendedMajor: "Business / Engineering",
    recruitingStatus: "Open",
    visibility: "recruiter_visible",
    profilePhotoUrl: "https://placehold.co/240x240/png?text=TK",
    verificationScore: 92
  },
  {
    id: "minjun-park",
    fullName: "Minjun Park",
    preferredName: "MJ",
    school: "Seoul International Academy",
    country: "South Korea",
    city: "Seoul",
    graduationYear: 2028,
    age: 16,
    position: "SF",
    height: "6'4\"",
    weight: "180 lb",
    dominantHand: "Right",
    team: "SIA Lions",
    jerseyNumber: 24,
    bio: "Wing scorer with length, defensive effort, and transition finishing ability.",
    gpa: "3.8/4.0",
    intendedMajor: "Economics",
    recruitingStatus: "Open",
    visibility: "recruiter_visible",
    profilePhotoUrl: "https://placehold.co/240x240/png?text=MP",
    verificationScore: 86
  },
  {
    id: "daniel-choi",
    fullName: "Daniel Choi",
    preferredName: "Daniel",
    school: "Busan Global School",
    country: "South Korea",
    city: "Busan",
    graduationYear: 2027,
    age: 17,
    position: "C",
    height: "6'7\"",
    weight: "210 lb",
    dominantHand: "Left",
    team: "BGS Sharks",
    jerseyNumber: 32,
    bio: "Rim protector and rebounder with developing mid-range touch.",
    gpa: "3.5/4.0",
    intendedMajor: "Sports Management",
    recruitingStatus: "Contacted",
    visibility: "link_only",
    profilePhotoUrl: "https://placehold.co/240x240/png?text=DC",
    verificationScore: 78
  }
];

export const games: Game[] = [
  {
    id: "game-001",
    date: "2026-02-14",
    opponent: "KIS Dragons",
    teamName: "SJA Jeju Varsity",
    location: "Jeju, South Korea",
    finalScore: "68-61 W",
    tournament: "Provincial High School Tournament",
    videoUrl: "https://example.com/video/game-001",
    approvalStatus: "approved"
  },
  {
    id: "game-002",
    date: "2026-02-21",
    opponent: "NLCS Jeju",
    teamName: "SJA Jeju Varsity",
    location: "Jeju, South Korea",
    finalScore: "59-64 L",
    tournament: "Island League Match",
    videoUrl: "https://example.com/video/game-002",
    approvalStatus: "pending"
  }
];

export const statLines: StatLine[] = [
  {
    id: "stat-001",
    playerId: "tyler-kim",
    gameId: "game-001",
    points: 18,
    rebounds: 5,
    assists: 7,
    steals: 3,
    blocks: 0,
    turnovers: 2,
    fgm: 7,
    fga: 14,
    tpm: 3,
    tpa: 7,
    ftm: 1,
    fta: 2,
    minutes: 30,
    source: "coach_sheet",
    verificationStatus: "verified",
    confidence: "High",
    verifierNote: "Matched coach stat sheet and game video timestamps."
  },
  {
    id: "stat-002",
    playerId: "tyler-kim",
    gameId: "game-002",
    points: 14,
    rebounds: 4,
    assists: 5,
    steals: 1,
    blocks: 0,
    turnovers: 3,
    fgm: 5,
    fga: 12,
    tpm: 2,
    tpa: 6,
    ftm: 2,
    fta: 2,
    minutes: 28,
    source: "manual",
    verificationStatus: "pending",
    confidence: "Medium",
    verifierNote: "Awaiting video review."
  },
  {
    id: "stat-003",
    playerId: "minjun-park",
    gameId: "game-001",
    points: 22,
    rebounds: 8,
    assists: 2,
    steals: 2,
    blocks: 1,
    turnovers: 4,
    fgm: 9,
    fga: 18,
    tpm: 2,
    tpa: 5,
    ftm: 2,
    fta: 3,
    minutes: 31,
    source: "ai_partner",
    verificationStatus: "verified",
    confidence: "High",
    verifierNote: "Imported from partner stat engine; reviewed by admin."
  }
];

export const recruiters: Recruiter[] = [
  {
    id: "recruiter-001",
    fullName: "Alex Morgan",
    program: "Pacific Northwest College",
    title: "Assistant Coach",
    email: "coach@example.edu",
    status: "approved",
    savedPlayerIds: ["tyler-kim", "minjun-park"]
  },
  {
    id: "recruiter-002",
    fullName: "Jamie Lee",
    program: "West Coast Prep Academy",
    title: "Recruiting Coordinator",
    email: "jlee@example.edu",
    status: "pending",
    savedPlayerIds: []
  }
];

export const contactRequests: ContactRequest[] = [
  {
    id: "request-001",
    recruiterId: "recruiter-001",
    playerId: "tyler-kim",
    message: "Interested in learning more about Tyler's academic profile and upcoming tournament schedule.",
    status: "pending",
    createdAt: "2026-07-07"
  }
];

export function getPlayerStats(playerId: string) {
  const stats = statLines.filter((line) => line.playerId === playerId);
  const verified = stats.filter((line) => line.verificationStatus === "verified");
  const source = verified.length > 0 ? verified : stats;
  const count = source.length || 1;

  return {
    games: source.length,
    ppg: average(source.map((s) => s.points), count),
    rpg: average(source.map((s) => s.rebounds), count),
    apg: average(source.map((s) => s.assists), count),
    spg: average(source.map((s) => s.steals), count),
    fg: percentage(sum(source.map((s) => s.fgm)), sum(source.map((s) => s.fga))),
    three: percentage(sum(source.map((s) => s.tpm)), sum(source.map((s) => s.tpa))),
    verifiedCount: verified.length,
    pendingCount: stats.filter((line) => line.verificationStatus === "pending").length
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[], count: number) {
  if (!values.length) return "0.0";
  return (sum(values) / count).toFixed(1);
}

function percentage(made: number, attempted: number) {
  if (!attempted) return "0%";
  return `${Math.round((made / attempted) * 100)}%`;
}
