import { submitEvidence } from "@/app/forms/actions";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function UploadPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAuthenticatedUser("/upload");
  const params = await searchParams;
  return (
    <main className="container-page py-10">
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
              <input name="opponent" required className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="KIS Dragons" />
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Tournament / league
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
          <fieldset>
            <legend className="text-sm font-semibold text-ink">Your stat line</legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatInput name="points" label="Points" />
              <StatInput name="rebounds" label="Rebounds" />
              <StatInput name="assists" label="Assists" />
              <StatInput name="steals" label="Steals" />
              <StatInput name="blocks" label="Blocks" />
              <StatInput name="turnovers" label="Turnovers" />
              <StatInput name="minutes" label="Minutes" />
            </div>
          </fieldset>
          <button type="submit" className="rounded-full bg-court px-5 py-3 font-bold text-white">Submit for review</button>
        </form>
      </div>
    </main>
  );
}

function StatInput({ name, label }: { name: string; label: string }) {
  return <label className="grid gap-1 text-xs font-semibold text-muted">{label}<input name={name} type="number" min="0" defaultValue="0" required className="rounded-xl border border-line px-3 py-2 text-ink" /></label>;
}
