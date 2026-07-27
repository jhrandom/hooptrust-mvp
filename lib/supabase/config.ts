export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return false;
  if (
    url.includes("YOUR_PROJECT") ||
    url.includes("your-project") ||
    url.includes("your_project") ||
    publishableKey.includes("...")
  ) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.endsWith(".supabase.co") &&
      publishableKey.startsWith("sb_publishable_") &&
      publishableKey.length > 30
    );
  } catch {
    return false;
  }
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!isSupabaseConfigured() || !url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Replace the placeholder URL and publishable key in .env.local with values from your Supabase project's Connect dialog."
    );
  }

  return { url, publishableKey };
}
