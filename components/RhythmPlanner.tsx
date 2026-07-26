"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Dumbbell, ExternalLink, Gamepad2, Headphones, LoaderCircle, Moon, Music2, Sparkles, Unplug } from "lucide-react";
import {
  getRhythmRecommendation,
  rhythmSituations,
  type RhythmGoalId,
  type RhythmSituationId
} from "@/lib/rhythm-data";

const situationIcons: Record<RhythmSituationId, React.ReactNode> = {
  "pre-game": <Gamepad2 size={22} />,
  training: <Dumbbell size={22} />,
  "post-game": <Moon size={22} />
};

export function RhythmPlanner() {
  const [selectedSituationId, setSelectedSituationId] = useState<RhythmSituationId>("pre-game");
  const selectedSituation = rhythmSituations.find((situation) => situation.id === selectedSituationId) ?? rhythmSituations[0];
  const [selectedMoodId, setSelectedMoodId] = useState(selectedSituation.moods[0].id);
  const [selectedGoalId, setSelectedGoalId] = useState<RhythmGoalId>(selectedSituation.goals[0].id);
  const [spotify, setSpotify] = useState<{ configured: boolean; connected: boolean; displayName?: string } | null>(null);
  const [spotifyCheckError, setSpotifyCheckError] = useState(false);
  const [allowExplicit, setAllowExplicit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<{ playlistUrl: string; playlistName: string; tracks: Array<{ name: string; artist: string }> } | null>(null);

  const recommendation = useMemo(
    () => getRhythmRecommendation(selectedSituationId, selectedMoodId, selectedGoalId),
    [selectedSituationId, selectedMoodId, selectedGoalId]
  );

  async function checkSpotifyStatus() {
    setSpotifyCheckError(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch("/api/spotify/status", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Spotify status request failed.");
      const status = await response.json();
      setSpotify(status);
      return Boolean(status.connected);
    } catch {
      setSpotify({ configured: false, connected: false });
      setSpotifyCheckError(true);
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  useEffect(() => {
    void (async () => {
      const spotifyResult = new URLSearchParams(window.location.search).get("spotify");
      let connected = await checkSpotifyStatus();

      // Immediately after an OAuth redirect, the first request can race with
      // browser cookie persistence or the development server's route state.
      // Retry briefly before declaring the newly created session unavailable.
      if (spotifyResult === "connected" && !connected) {
        for (const delay of [250, 750, 1500]) {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
          connected = await checkSpotifyStatus();
          if (connected) break;
        }
      }

      if (spotifyResult === "connected") {
        setMessage(
          connected
            ? "Spotify connected successfully."
            : "Spotify approved access, but the saved session could not be verified. Please connect again."
        );
      } else if (spotifyResult) {
        const errors: Record<string, string> = {
          "invalid-state": "Spotify connection could not be verified. Please try again from this page.",
          "connection-failed": "Spotify accepted permission, but the token exchange failed. Check the server terminal for details.",
          "session-not-ready": "Spotify authorized access, but the server could not recover the new session.",
          "access_denied": "Spotify permission was not granted.",
          "not-configured": "Spotify credentials are not configured."
        };
        setMessage(errors[spotifyResult] ?? `Spotify connection failed: ${spotifyResult}`);
      }

      if (spotifyResult) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    })();
  }, []);

  function chooseSituation(id: RhythmSituationId) {
    const nextSituation = rhythmSituations.find((situation) => situation.id === id) ?? rhythmSituations[0];
    setSelectedSituationId(id);
    setSelectedMoodId(nextSituation.moods[0].id);
    setSelectedGoalId(nextSituation.goals[0].id);
    setPlaylist(null);
    setMessage(null);
  }

  async function createPlaylist() {
    setCreating(true);
    setMessage(null);
    setPlaylist(null);
    try {
      const response = await fetch("/api/spotify/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: true, situationId: selectedSituationId, moodId: selectedMoodId, goalId: selectedGoalId, allowExplicit })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create the playlist.");
      setPlaylist(data);
      setMessage(`Created a private playlist with ${data.tracks.length} tracks.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the playlist.");
    } finally {
      setCreating(false);
    }
  }

  async function disconnectSpotify() {
    await fetch("/api/spotify/disconnect", { method: "POST" });
    setSpotify((current) => ({ configured: current?.configured ?? true, connected: false }));
    setPlaylist(null);
    setMessage("Spotify disconnected from this browser.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-5">
        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-court">Step 1</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Choose the athlete situation</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            HoopTrust Rhythm starts with the moment in the athlete’s routine, then recommends music based on mood and performance goal.
          </p>
          <div className="mt-5 grid gap-3">
            {rhythmSituations.map((situation) => {
              const active = situation.id === selectedSituationId;
              return (
                <button
                  key={situation.id}
                  type="button"
                  onClick={() => chooseSituation(situation.id)}
                  aria-pressed={active}
                  className={`rounded-3xl border p-4 text-left transition ${
                    active ? "border-court bg-orange-50 shadow-sm" : "border-line bg-white hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-court text-white" : "bg-slate-100 text-ink"}`}>
                      {situationIcons[situation.id]}
                    </span>
                    <span>
                      <span className="block text-lg font-black text-ink">{situation.label}</span>
                      <span className="mt-1 block text-sm font-semibold text-trust">{situation.tagline}</span>
                      <span className="mt-2 block text-sm leading-6 text-muted">{situation.description}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-court">Step 2</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Choose current mood</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {selectedSituation.moods.map((mood) => {
              const active = mood.id === selectedMoodId;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => setSelectedMoodId(mood.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active ? "border-trust bg-teal-50" : "border-line bg-white hover:border-teal-200 hover:bg-teal-50/50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-black text-ink">{mood.label}</span>
                    {active ? <CheckCircle2 className="text-trust" size={19} /> : null}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-muted">{mood.helper}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-court">Step 3</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Choose desired goal</h2>
          <div className="mt-5 grid gap-3">
            {selectedSituation.goals.map((goal) => {
              const active = goal.id === selectedGoalId;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoalId(goal.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-slate-300"
                  }`}
                >
                  <span className="font-black">{goal.label}</span>
                  <span className={`mt-1 block text-sm ${active ? "text-white/75" : "text-muted"}`}>{goal.helper}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[2rem] border border-line bg-ink p-6 text-white shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                <Sparkles size={16} /> Recommendation preview
              </p>
              <h2 className="mt-5 text-3xl font-black">{recommendation.playlistName}</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">{recommendation.explanation}</p>
            </div>
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-court text-white sm:flex">
              <Headphones size={26} />
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoPill label="Vibe" value={recommendation.vibe} />
            <InfoPill label="Target tempo" value={recommendation.bpmRange} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-court">Spotify connection</p>
              <h3 className="mt-2 text-2xl font-black text-ink">
                {spotify?.connected
                  ? spotify.displayName
                    ? `Connected as ${spotify.displayName}`
                    : "Spotify connected"
                  : "Create a real private playlist"}
              </h3>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <Music2 size={22} />
            </span>
          </div>
          {!spotify ? (
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-muted"><LoaderCircle className="animate-spin" size={18} /> Checking Spotify…</div>
          ) : spotifyCheckError ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-muted">
              <p>Spotify status could not be checked. The page will continue to work without Spotify.</p>
              <button type="button" onClick={() => void checkSpotifyStatus()} className="mt-3 font-black text-green-700">
                Try Spotify check again
              </button>
            </div>
          ) : !spotify.configured ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-muted">
              Add the three Spotify variables from <code>.env.example</code> to <code>.env.local</code>, then restart the app.
            </div>
          ) : !spotify.connected ? (
            <a href="/api/spotify/connect" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 font-black text-white">
              Connect Spotify <ExternalLink size={18} />
            </a>
          ) : (
            <>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-slate-50 p-4">
                <input type="checkbox" checked={allowExplicit} onChange={(event) => setAllowExplicit(event.target.checked)} className="mt-1 h-4 w-4 accent-green-600" />
                <span>
                  <span className="block text-sm font-black text-ink">Allow explicit tracks</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">Off by default, which is recommended for youth athletes and shared training spaces.</span>
                </span>
              </label>
              <button type="button" onClick={createPlaylist} disabled={creating} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 font-black text-white disabled:cursor-wait disabled:opacity-60">
                {creating ? <LoaderCircle className="animate-spin" size={18} /> : <Music2 size={18} />}
                {creating ? "Building playlist…" : "Create private 10-song Spotify playlist"}
              </button>
              <button type="button" onClick={disconnectSpotify} className="mt-3 inline-flex w-full items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-muted hover:text-ink">
                <Unplug size={16} /> Disconnect Spotify
              </button>
            </>
          )}
          {message ? <p aria-live="polite" className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-muted">{message}</p> : null}
          {playlist ? (
            <div className="mt-4 rounded-3xl border border-green-200 bg-green-50 p-4">
              <p className="font-black text-ink">{playlist.playlistName}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {playlist.tracks.map((track) => <li key={`${track.name}-${track.artist}`}>{track.name} · {track.artist}</li>)}
              </ul>
              <a href={playlist.playlistUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-black text-green-700">
                Open in Spotify <ExternalLink size={17} />
              </a>
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-court">Track recommendation shell</p>
              <h3 className="mt-2 text-2xl font-black text-ink">Recommended track slots</h3>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {recommendation.tracks.map((track, index) => (
              <div key={`${track.title}-${index}`} className="rounded-3xl border border-line bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-court">Track {index + 1}</p>
                    <h4 className="mt-1 text-lg font-black text-ink">{track.title}</h4>
                    <p className="text-sm text-muted">{track.artist} · {track.tempo} tempo</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-trust">Spotify search</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{track.reason}</p>
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-muted">
                  Query: {track.spotifySearchQuery}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-200 bg-orange-50 p-6">
          <h3 className="text-lg font-black text-ink">Product note</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            This page uses the name HoopTrust Rhythm instead of “music therapy” because the MVP should avoid sounding like a clinical or medical treatment. The product language focuses on performance routines, mood, preparation, and recovery.
          </p>
        </div>
      </section>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-white">{value}</p>
    </div>
  );
}
