"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MfaSettings() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  async function enroll() {
    const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "HoopTrust authenticator" });
    if (error) return setMessage(error.message);
    setFactorId(data.id); setQr(data.totp.qr_code);
  }
  async function verify() {
    if (!factorId) return;
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) return setMessage(challenge.error.message);
    const result = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
    setMessage(result.error ? result.error.message : "Authenticator MFA enabled.");
    if (!result.error) { setQr(null); setFactorId(null); }
  }
  return <div>{!qr ? <button type="button" onClick={enroll} className="rounded-full bg-ink px-4 py-2 font-bold text-white">Set up authenticator MFA</button> : <div className="mt-4"><img src={qr} alt="Authenticator QR code" className="h-48 w-48" /><p className="mt-3 text-sm text-muted">Scan the QR code, then enter its six-digit code.</p><div className="mt-3 flex gap-2"><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" maxLength={6} aria-label="Authenticator code" className="rounded-xl border border-line px-3 py-2" /><button type="button" onClick={verify} className="rounded-full bg-court px-4 py-2 font-bold text-white">Verify</button></div></div>}{message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}</div>;
}
