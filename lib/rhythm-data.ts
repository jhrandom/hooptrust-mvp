export type RhythmSituationId = "pre-game" | "training" | "post-game";

export type RhythmGoalId =
  | "lock-in"
  | "get-hyped"
  | "calm-nerves"
  | "push-intensity"
  | "steady-rhythm"
  | "recover"
  | "reset";

export type RhythmMood = {
  id: string;
  label: string;
  helper: string;
};

export type RhythmGoal = {
  id: RhythmGoalId;
  label: string;
  helper: string;
};

export type RhythmSituation = {
  id: RhythmSituationId;
  label: string;
  tagline: string;
  description: string;
  moods: RhythmMood[];
  goals: RhythmGoal[];
};

export type RhythmTrack = {
  title: string;
  artist: string;
  tempo: string;
  reason: string;
  spotifySearchQuery: string;
};

export type RhythmRecommendation = {
  playlistName: string;
  vibe: string;
  bpmRange: string;
  explanation: string;
  tracks: RhythmTrack[];
  spotifyActions: string[];
};

export const rhythmSituations: RhythmSituation[] = [
  {
    id: "pre-game",
    label: "Pre-game",
    tagline: "Focus, confidence, controlled energy",
    description:
      "Build a game-day soundtrack that helps athletes manage nerves, raise confidence, and enter warmups locked in.",
    moods: [
      { id: "nervous", label: "Nervous", helper: "I need to calm down and trust my preparation." },
      { id: "low-energy", label: "Low energy", helper: "I need more spark before warmups." },
      { id: "confident", label: "Confident", helper: "I want to maintain momentum without overdoing it." },
      { id: "too-hyped", label: "Too hyped", helper: "I need control before tipoff." }
    ],
    goals: [
      { id: "lock-in", label: "Lock in", helper: "Stay sharp and mentally prepared." },
      { id: "get-hyped", label: "Get hyped", helper: "Increase energy before competition." },
      { id: "calm-nerves", label: "Calm nerves", helper: "Reduce pressure and stay composed." }
    ]
  },
  {
    id: "training",
    label: "Training",
    tagline: "Tempo, repetition, motivation",
    description:
      "Create a training mix that matches drills, lifting, conditioning, or shooting work with the right energy level.",
    moods: [
      { id: "tired", label: "Tired", helper: "I need help starting the workout." },
      { id: "unfocused", label: "Unfocused", helper: "I need rhythm and less distraction." },
      { id: "motivated", label: "Motivated", helper: "I want to keep my intensity high." },
      { id: "bored", label: "Bored", helper: "I need variety and movement." }
    ],
    goals: [
      { id: "push-intensity", label: "Push intensity", helper: "High energy for hard reps." },
      { id: "steady-rhythm", label: "Steady rhythm", helper: "Consistent tempo for repeat drills." },
      { id: "lock-in", label: "Lock in", helper: "Stay focused through the full session." }
    ]
  },
  {
    id: "post-game",
    label: "Post-game",
    tagline: "Recovery, reflection, emotional reset",
    description:
      "Recommend calmer music after games to help athletes cool down, reflect, recover, or move on from frustration.",
    moods: [
      { id: "happy", label: "Happy", helper: "I want to enjoy the win and recover." },
      { id: "frustrated", label: "Frustrated", helper: "I need to reset after mistakes or a loss." },
      { id: "exhausted", label: "Exhausted", helper: "I need a calm cooldown." },
      { id: "stressed", label: "Stressed", helper: "I need to slow my mind down." }
    ],
    goals: [
      { id: "recover", label: "Recover", helper: "Slow down physically and mentally." },
      { id: "reset", label: "Reset", helper: "Process the game and move forward." },
      { id: "calm-nerves", label: "Calm down", helper: "Lower stress after competition." }
    ]
  }
];

const preGameFocusTracks: RhythmTrack[] = [
  {
    title: "Warmup Focus Track",
    artist: "Spotify catalog placeholder",
    tempo: "Medium",
    reason: "Steady rhythm for confidence without overexcitement.",
    spotifySearchQuery: "clean confident warmup hip hop steady beat"
  },
  {
    title: "Controlled Energy Track",
    artist: "Spotify catalog placeholder",
    tempo: "Medium-fast",
    reason: "Raises intensity while keeping decision-making calm.",
    spotifySearchQuery: "basketball pregame clean rap controlled energy"
  },
  {
    title: "Lock-In Instrumental",
    artist: "Spotify catalog placeholder",
    tempo: "Medium",
    reason: "Low-lyric focus option for visualization and stretching.",
    spotifySearchQuery: "instrumental trap focus warmup playlist"
  }
];

const hypeTracks: RhythmTrack[] = [
  {
    title: "Explosive Warmup Track",
    artist: "Spotify catalog placeholder",
    tempo: "Fast",
    reason: "Best for low-energy athletes who need a stronger start.",
    spotifySearchQuery: "clean hype basketball warmup playlist"
  },
  {
    title: "High-Motor Training Track",
    artist: "Spotify catalog placeholder",
    tempo: "Fast",
    reason: "Supports conditioning, lifting, and high-intensity reps.",
    spotifySearchQuery: "high energy clean workout rap basketball"
  },
  {
    title: "Fourth Quarter Energy",
    artist: "Spotify catalog placeholder",
    tempo: "Fast",
    reason: "Keeps tempo high when fatigue starts to build.",
    spotifySearchQuery: "sports motivation workout clean edm rap"
  }
];

const trainingRhythmTracks: RhythmTrack[] = [
  {
    title: "Shooting Reps Groove",
    artist: "Spotify catalog placeholder",
    tempo: "Medium",
    reason: "Consistent beat for repetitive skill work.",
    spotifySearchQuery: "steady beat shooting workout playlist"
  },
  {
    title: "Footwork Flow",
    artist: "Spotify catalog placeholder",
    tempo: "Medium-fast",
    reason: "Keeps the athlete moving without rushing mechanics.",
    spotifySearchQuery: "basketball training rhythm instrumental"
  },
  {
    title: "No-Distraction Drill Track",
    artist: "Spotify catalog placeholder",
    tempo: "Medium",
    reason: "Less vocal distraction for focused practice blocks.",
    spotifySearchQuery: "focus workout instrumental beats"
  }
];

const recoveryTracks: RhythmTrack[] = [
  {
    title: "Cooldown Reset",
    artist: "Spotify catalog placeholder",
    tempo: "Slow",
    reason: "Helps lower intensity after competition.",
    spotifySearchQuery: "calm post game recovery playlist"
  },
  {
    title: "Reflection Track",
    artist: "Spotify catalog placeholder",
    tempo: "Slow-medium",
    reason: "Good for journaling, stretching, or reviewing the game mentally.",
    spotifySearchQuery: "reflective chill music athlete recovery"
  },
  {
    title: "Sleep-Friendly Recovery",
    artist: "Spotify catalog placeholder",
    tempo: "Slow",
    reason: "Designed for late games and physical recovery.",
    spotifySearchQuery: "relaxing recovery sleep playlist"
  }
];

export function getRhythmRecommendation(
  situationId: RhythmSituationId,
  moodId: string,
  goalId: RhythmGoalId
): RhythmRecommendation {
  if (situationId === "post-game") {
    return {
      playlistName: goalId === "reset" ? "HoopTrust Rhythm · Post-Game Reset" : "HoopTrust Rhythm · Recovery Mode",
      vibe: moodId === "frustrated" ? "calm, reflective, emotionally steady" : "slow, clean, recovery-focused",
      bpmRange: "60–95 BPM",
      explanation:
        "Post-game music should help the athlete cool down instead of keeping adrenaline too high. This playlist framework prioritizes slower tracks for reflection, stretching, and mental reset.",
      tracks: recoveryTracks,
      spotifyActions: [
        "Search Spotify for calm recovery tracks",
        "Create a new post-game recovery playlist",
        "Add recommended tracks",
        "Open the playlist in Spotify"
      ]
    };
  }

  if (situationId === "training" && goalId === "steady-rhythm") {
    return {
      playlistName: "HoopTrust Rhythm · Training Rhythm",
      vibe: "consistent, repetitive, focused",
      bpmRange: "90–125 BPM",
      explanation:
        "Training music should support repetition. This playlist framework uses steady-tempo tracks that help shooting, ball-handling, footwork, and lifting sessions feel consistent.",
      tracks: trainingRhythmTracks,
      spotifyActions: [
        "Read the user’s existing training playlists",
        "Search Spotify for steady workout tracks",
        "Update an existing training playlist",
        "Open the playlist in Spotify"
      ]
    };
  }

  if (goalId === "get-hyped" || goalId === "push-intensity" || moodId === "low-energy" || moodId === "tired") {
    return {
      playlistName: situationId === "pre-game" ? "HoopTrust Rhythm · Game-Day Hype" : "HoopTrust Rhythm · High-Intensity Training",
      vibe: "high-energy, clean, competitive",
      bpmRange: "120–155 BPM",
      explanation:
        "This recommendation is built for athletes who need more energy. It should avoid overly distracting songs while still increasing intensity before competition or hard training blocks.",
      tracks: hypeTracks,
      spotifyActions: [
        "Search Spotify’s catalog for high-energy clean tracks",
        "Create a new HoopTrust Rhythm playlist",
        "Add recommended tracks",
        "Open that playlist in Spotify"
      ]
    };
  }

  return {
    playlistName: "HoopTrust Rhythm · Pre-Game Lock-In",
    vibe: "confident, controlled, focused",
    bpmRange: "85–120 BPM",
    explanation:
      "This recommendation is designed for players who need confidence and focus before competition. The goal is to build energy without losing composure.",
    tracks: preGameFocusTracks,
    spotifyActions: [
      "Read the user’s playlists for preferred genres",
      "Search Spotify for matching tracks",
      "Create a new pre-game playlist",
      "Add recommended tracks",
      "Open the playlist in Spotify"
    ]
  };
}
