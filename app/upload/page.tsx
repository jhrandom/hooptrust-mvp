export default function UploadPage() {
  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-court">Evidence upload</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Add a game video or link</h1>
        <p className="mt-3 text-muted">
          For the MVP, video links are recommended to control hosting costs. Direct file storage can be connected later through Supabase Storage or S3.
        </p>
        <form className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Video URL
            <input className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="https://..." />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Game date
              <input type="date" className="rounded-2xl border border-line px-4 py-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Opponent
              <input className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="KIS Dragons" />
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Tournament / league
              <input className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="Provincial Tournament" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Final score
              <input className="rounded-2xl border border-line px-4 py-3 font-normal" placeholder="68-61 W" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Notes for verifier
            <textarea className="min-h-28 rounded-2xl border border-line px-4 py-3 font-normal" placeholder="Add context, jersey numbers, timestamps, or scorer notes." />
          </label>
          <button type="button" className="rounded-full bg-court px-5 py-3 font-bold text-white">Submit for review</button>
        </form>
      </div>
    </main>
  );
}
