const defaultHosts = ["youtube.com", "youtu.be", "vimeo.com", "hudl.com", "drive.google.com", "dropbox.com"];

export function validateEvidenceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "Video evidence must use a secure HTTPS link.";
    if (url.username || url.password) return "Video links cannot contain embedded credentials.";
    const configured = process.env.VIDEO_ALLOWED_HOSTS?.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean) ?? [];
    const hosts = [...defaultHosts, ...configured];
    const allowed = hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    return allowed ? null : `Unsupported video provider. Allowed providers: ${hosts.join(", ")}.`;
  } catch {
    return "Enter a valid video URL.";
  }
}
