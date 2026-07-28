import { submitEvidence } from "@/app/forms/actions";
import { requireAuthenticatedUser } from "@/lib/auth";
import { PortalBackLink } from "@/components/PortalBackLink";
import { StatSubmissionFields } from "@/components/StatSubmissionFields";

export default async function UploadPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAuthenticatedUser("/upload");
  const params = await searchParams;
  return (
    <main className="container-page py-10">
      <PortalBackLink />
      <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">Evidence upload</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Add a game video or link</h1>
        <p className="mt-3 text-muted">
          For the MVP, video links are recommended to control hosting costs. Direct file storage can be connected later through Supabase Storage or S3.
        </p>
        {params.error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{params.error}</p> : null}
        {params.message ? <p className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{params.message}</p> : null}
        <form action={submitEvidence} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Video URL
            <input name="videoUrl" type="url" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="https://..." />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Game date
              <input name="gameDate" type="date" required className="rounded-2xl border border-line px-4 py-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Opponent
              <input name="opponent" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="KIS Dragons" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Team for this game
            <input name="teamName" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="SJA Jeju Varsity" />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Tournament / League
              <input name="tournament" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="Provincial Tournament" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Final score
              <input name="finalScore" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="68-61 W" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Location
            <input name="location" className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="Jeju, South Korea" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            <span>Player&apos;s jersey number <span className="text-red-600" aria-label="required">*</span></span>
            <input name="jerseyNumber" type="number" min="0" max="999" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="11" />
          </label>
          <StatSubmissionFields />
          <button type="submit" className="rounded-full bg-court px-5 py-3 font-bold text-white">Submit for review</button>
        </form>
      </div>
    </main>
  );
}
