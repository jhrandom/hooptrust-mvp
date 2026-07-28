"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfilePhotoUpload({ initialUrl }: { initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Use a JPG, PNG, or WebP image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    setMessage(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setMessage("Log in again before uploading.");
      setUploading(false);
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/profile.${extension}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (error) setMessage(error.message);
    else {
      const publicUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
      setUrl(`${publicUrl}?v=${Date.now()}`);
      setMessage("Photo uploaded. Save the profile to keep it.");
    }
    setUploading(false);
  }

  return (
    <div className="rounded-3xl border border-line bg-slate-50 p-5 md:col-span-2">
      <p className="text-sm font-semibold text-ink">Profile photo</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {url ? <img src={url} alt="Player profile preview" className="h-24 w-24 rounded-2xl object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-200 text-xs font-bold text-muted">No photo</div>}
        <label className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
          {uploading ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} className="sr-only" />
        </label>
      </div>
      <input type="hidden" name="profilePhotoUrl" value={url} />
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
