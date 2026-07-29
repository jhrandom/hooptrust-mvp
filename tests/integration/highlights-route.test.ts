import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc: mocks.rpc }))
}));

import { PATCH } from "@/app/api/player/highlights/route";

describe("PATCH /api/player/highlights", () => {
  beforeEach(() => mocks.rpc.mockReset());

  it("rejects malformed identifiers and unsafe ordering", async () => {
    const response = await PATCH(new Request("http://test/api/player/highlights", {
      method: "PATCH",
      body: JSON.stringify({ videoId: "not-a-uuid", isHighlight: true, order: 101 })
    }));
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("sends a valid update through the ownership-enforcing database RPC", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    const body = { videoId: "7e8e4cd8-afbb-4c49-a558-f0c51e840ad1", isHighlight: true, order: 2 };
    const response = await PATCH(new Request("http://test/api/player/highlights", {
      method: "PATCH", body: JSON.stringify(body)
    }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("set_video_highlight", {
      p_video_id: body.videoId, p_is_highlight: true, p_order: 2
    });
  });

  it("does not hide database authorization failures", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "Only your approved videos can become highlights" } });
    const response = await PATCH(new Request("http://test/api/player/highlights", {
      method: "PATCH",
      body: JSON.stringify({ videoId: "7e8e4cd8-afbb-4c49-a558-f0c51e840ad1", isHighlight: true, order: 0 })
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("approved videos") });
  });
});
