import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const startedAt = Date.now();
  const { error } = await (await createClient()).from("profiles").select("id", { head: true, count: "exact" }).limit(1);
  return NextResponse.json(
    {
      status: error ? "degraded" : "ok",
      database: error ? "unavailable" : "connected",
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } }
  );
}
