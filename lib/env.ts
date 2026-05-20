export function getPublicSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  const issue = validateSupabasePublicConfig(
    value,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (issue) {
    throw new Error(issue);
  }
  return value;
}

export function getPublicSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const issue = validateSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    value,
  );
  if (issue) {
    throw new Error(issue);
  }
  return value;
}

export function getOpenAIKey() {
  const value = process.env.OPENAI_API_KEY;
  if (!value) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return value;
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function validateSupabasePublicConfig(
  url: string | undefined,
  anonKey: string | undefined,
) {
  if (!url) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local and restart the dev server.";
  }

  try {
    if (url.startsWith("sb_publishable_") || url.startsWith("sb_secret_")) {
      return "NEXT_PUBLIC_SUPABASE_URL looks like a Supabase API key. Use the project URL instead, for example https://your-project-ref.supabase.co.";
    }

    const parsed = new URL(url);
    if (
      parsed.hostname === "placeholder.supabase.co" ||
      parsed.hostname === "your-project-ref.supabase.co" ||
      parsed.hostname.includes("placeholder")
    ) {
      return "NEXT_PUBLIC_SUPABASE_URL is still a placeholder. Add your real Supabase project URL to .env.local and restart the dev server.";
    }
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. It should look like https://your-project-ref.supabase.co.";
  }

  if (!anonKey) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local and restart the dev server.";
  }

  if (anonKey.includes("placeholder") || anonKey === "your-supabase-anon-key") {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is still a placeholder. Add your real Supabase anon key to .env.local and restart the dev server.";
  }

  if (anonKey.startsWith("sb_secret_")) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY must not use a private Supabase secret key. Use the public anon or publishable key instead.";
  }

  return null;
}

export function isSupabasePublicConfigReady() {
  return (
    validateSupabasePublicConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ) === null
  );
}

export function getSupabaseProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}
