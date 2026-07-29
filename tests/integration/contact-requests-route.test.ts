import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn()
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getClaims: mocks.getClaims }, rpc: mocks.rpc, from: mocks.from }))
}));

import { POST } from "@/app/api/contact-requests/route";

const validBody = {
  playerId: "6ad9070a-07f6-4639-bc0b-faf98827ec14",
  message: "I would like to discuss your basketball program."
};

describe("POST /api/contact-requests", () => {
  beforeEach(() => {
    mocks.getClaims.mockReset();
    mocks.rpc.mockReset();
    mocks.from.mockReset();
  });

  it("validates input before accessing authentication or the database", async () => {
    const response = await POST(new Request("http://test/api/contact-requests", {
      method: "POST", body: JSON.stringify({ ...validBody, message: "short" })
    }));
    expect(response.status).toBe(400);
    expect(mocks.getClaims).not.toHaveBeenCalled();
  });

  it("rejects anonymous users", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null } });
    const response = await POST(new Request("http://test/api/contact-requests", {
      method: "POST", body: JSON.stringify(validBody)
    }));
    expect(response.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("enforces the contact-request rate limit before recruiter lookup", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    mocks.rpc.mockResolvedValue({ data: false });
    const response = await POST(new Request("http://test/api/contact-requests", {
      method: "POST", body: JSON.stringify(validBody)
    }));
    expect(response.status).toBe(429);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects recruiters who are not approved", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    mocks.rpc.mockResolvedValue({ data: true });
    mocks.from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "recruiter-1", status: "pending" } }) }) })
    });
    const response = await POST(new Request("http://test/api/contact-requests", {
      method: "POST", body: JSON.stringify(validBody)
    }));
    expect(response.status).toBe(403);
  });
});
