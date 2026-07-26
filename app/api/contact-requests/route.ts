import { NextResponse } from "next/server";
import { z } from "zod";

const ContactRequestSchema = z.object({
  recruiterId: z.string().min(1),
  playerId: z.string().min(1),
  message: z.string().min(10).max(1000)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ContactRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact request", details: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: Insert into Supabase contact_requests table.
  // TODO: Notify player/guardian/admin for approval.
  return NextResponse.json({
    id: crypto.randomUUID(),
    status: "pending",
    ...parsed.data
  });
}
