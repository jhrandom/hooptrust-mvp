import { afterEach, describe, expect, it } from "vitest";
import { validateEvidenceUrl } from "@/lib/media-url";

afterEach(() => delete process.env.VIDEO_ALLOWED_HOSTS);

describe("evidence URL allowlist", () => {
  it.each([
    "https://youtube.com/watch?v=abc",
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://vimeo.com/123",
    "https://team.hudl.com/video/123",
    "https://drive.google.com/file/123",
    "https://dropbox.com/s/123"
  ])("accepts a supported HTTPS provider: %s", (url) => {
    expect(validateEvidenceUrl(url)).toBeNull();
  });

  it("accepts configured providers and their subdomains", () => {
    process.env.VIDEO_ALLOWED_HOSTS = "videos.example.org";
    expect(validateEvidenceUrl("https://cdn.videos.example.org/game/1")).toBeNull();
  });

  it("rejects insecure, credential-bearing, malformed, and deceptive URLs", () => {
    expect(validateEvidenceUrl("http://youtube.com/watch?v=abc")).toContain("HTTPS");
    expect(validateEvidenceUrl("https://user:pass@youtube.com/watch?v=abc")).toContain("credentials");
    expect(validateEvidenceUrl("not a URL")).toContain("valid");
    expect(validateEvidenceUrl("https://youtube.com.attacker.example/video")).toContain("Unsupported");
  });
});
