import Link from "next/link";
import { Bell, CalendarDays, Download, Eye, Headphones, Mail, Settings, UploadCloud, UserRoundCog } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { requireProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PlayerDashboardPage() {
  const auth = await requireProfileRole(["player", "guardian"], "/dashboard/player");
  const supabase = await createClient();
  const { data: player } = await supabase.from("players").select("*").eq("user_id", auth!.userId).maybeSingle();

  if (!player) {
    return (
      <main className="container-page py-10">
        <h1 className="text-3xl font-black text-ink">Player portal</h1>
        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="font-black text-ink">Complete your player profile first</h2>
          <p className="mt-2 text-sm text-muted">Your profile connects game submissions, recruiter discovery, and contact permissions.</p>
          <Link href="/profile" className="mt-4 inline-flex rounded-full bg-court px-5 py-3 font-bold text-white">Create player profile</Link>
        </div>
      </main>
    );
  }

  const [
    { data: contact },
    { data: stats },
    { data: videos },
    { data: requests },
    { count: viewCount },
    { count: saveCount },
    { data: schedule },
    { data: latestPlaylist }
  ] = await Promise.all([
    supabase.from("player_contact_details").select("contact_name, relationship, consent_confirmed_at").eq("player_id", player.id).maybeSingle(),
    supabase.from("stats").select("id, points, rebounds, assists, verification_status, updated_at, games(opponent, game_date)").eq("player_id", player.id).order("created_at", { ascending: false }),
    supabase.from("videos").select("id, video_url, approval_status, review_notes, created_at, games(opponent, game_date)").eq("player_id", player.id).order("created_at", { ascending: false }),
    supabase.from("contact_requests").select("id, status, created_at").eq("player_id", player.id).order("created_at", { ascending: false }),
    supabase.from("player_profile_views").select("*", { count: "exact", head: true }).eq("player_id", player.id),
    supabase.from("saved_players").select("*", { count: "exact", head: true }).eq("player_id", player.id),
    supabase.from("player_schedule").select("*").eq("player_id", player.id).gte("event_date", new Date().toISOString()).order("event_date").limit(3),
    supabase.from("rhythm_playlists").select("playlist_name, playlist_url, created_at").eq("user_id", auth!.userId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);

  const required = [
    ["Full name", player.full_name], ["School", player.school], ["Country", player.country],
    ["Graduation year", player.graduation_year], ["Birth year", player.birth_year],
    ["Position", player.position], ["Height", player.height], ["Weight", player.weight],
    ["Dominant hand", player.dominant_hand], ["Profile photo", player.profile_photo_url]
  ] as const;
  const missing = required.filter(([, value]) => !value).map(([label]) => label);
  const completion = Math.round(((required.length - missing.length) / required.length) * 100);
  const verified = (stats ?? []).filter((line) => line.verification_status === "verified");
  const average = (key: "points" | "rebounds" | "assists") =>
    verified.length ? (verified.reduce((sum, line) => sum + (line[key] ?? 0), 0) / verified.length).toFixed(1) : "—";
  const pendingRequests = (requests ?? []).filter((request) => request.status === "pending").length;

  return (
    <main className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-wide text-court">Player portal</p><h1 className="mt-2 text-3xl font-black text-ink">Welcome, {player.preferred_name || player.full_name}</h1></div>
        <Link href={`/players/${player.id}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white"><Eye size={18} /> Preview my profile</Link>
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-ink">Profile completion</h2><p className="mt-1 text-sm text-muted">{completion}% complete</p></div><span className="text-3xl font-black text-court">{completion}%</span></div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-court" style={{ width: `${completion}%` }} /></div>
        {missing.length ? <p className="mt-4 text-sm text-muted">Still needed: <span className="font-bold text-ink">{missing.join(", ")}</span></p> : <p className="mt-4 text-sm font-bold text-green-700">Your profile is complete.</p>}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Verified games" value={verified.length} helper="Admin-verified stat lines" />
        <MetricCard label="PPG" value={average("points")} helper="Verified games" />
        <MetricCard label="RPG" value={average("rebounds")} helper="Verified games" />
        <MetricCard label="APG" value={average("assists")} helper="Verified games" />
        <MetricCard label="Recruiter activity" value={(viewCount ?? 0) + (saveCount ?? 0)} helper={`${viewCount ?? 0} views · ${saveCount ?? 0} saves`} />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Action href="/profile" icon={<UserRoundCog />} title="Edit profile" body={`Visibility: ${humanize(player.visibility ?? "private")}`} />
        <Action href="/upload" icon={<UploadCloud />} title="Upload stats and video" body="Submit new game evidence." />
        <Action href="/submissions" icon={<Bell />} title="Submissions and feedback" body={`${(videos ?? []).filter((video) => video.approval_status === "pending").length} awaiting review`} />
        <Action href="/contact-requests" icon={<Mail />} title="Contact requests" body={`${pendingRequests} require attention`} />
        <Action href="/schedule" icon={<CalendarDays />} title="Schedule" body={`${schedule?.length ?? 0} upcoming events`} />
        <Action href="/notifications" icon={<Bell />} title="Notifications" body="Review decisions and recruiter activity." />
        <Action href="/api/player/export" icon={<Download />} title="Export profile" body="Download your data as JSON." />
        <Action href="/settings" icon={<Settings />} title="Privacy and account" body="Consent, visibility, and deletion requests." />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Recent submissions</h2>
          <div className="mt-4 space-y-3">{(videos ?? []).slice(0, 3).map((video) => {
            const game = Array.isArray(video.games) ? video.games[0] : video.games;
            return <Link key={video.id} href="/submissions" className="block rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-bold text-ink">{game?.opponent ? `vs ${game.opponent}` : "Game evidence"}</p><Status value={video.approval_status ?? "pending"} /></div>{video.review_notes ? <p className="mt-2 text-sm text-muted">{video.review_notes}</p> : null}</Link>;
          })}{!videos?.length ? <p className="text-sm text-muted">No evidence submitted yet.</p> : null}</div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Privacy and routine</h2>
          <p className="mt-3 text-sm text-muted">Profile visibility: <span className="font-bold text-ink">{humanize(player.visibility ?? "private")}</span></p>
          <p className="mt-2 text-sm text-muted">Designated contact: <span className="font-bold text-ink">{contact ? `${contact.contact_name} (${contact.relationship})` : "Not configured"}</span></p>
          {latestPlaylist ? <a href={latestPlaylist.playlist_url} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 p-4 font-bold text-green-800"><Headphones size={18} /> {latestPlaylist.playlist_name}</a> : <Link href="/rhythm" className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 p-4 font-bold text-green-800"><Headphones size={18} /> Build a Rhythm playlist</Link>}
        </div>
      </section>
    </main>
  );
}

function Action({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return <Link href={href} className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-court">{icon}</div><h2 className="mt-5 font-black text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{body}</p></Link>;
}

function Status({ value }: { value: string }) {
  return <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black uppercase text-muted">{value}</span>;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
