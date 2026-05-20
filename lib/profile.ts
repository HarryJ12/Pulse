import type { SupabaseClient, User } from "@supabase/supabase-js";

import { DatabaseSetupError, isMissingSchemaError } from "@/lib/errors";
import type { Profile } from "@/lib/types";

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function profileFromUser(user: User) {
  const metadata = user.user_metadata ?? {};
  const githubUsername =
    cleanString(metadata.user_name) ??
    cleanString(metadata.preferred_username) ??
    cleanString(metadata.login);
  const name =
    cleanString(metadata.full_name) ??
    cleanString(metadata.name) ??
    githubUsername ??
    cleanString(user.email)?.split("@")[0] ??
    "Pulse member";

  return {
    id: user.id,
    name,
    email: cleanString(user.email),
    github_username: githubUsername,
    github_url:
      cleanString(metadata.html_url) ??
      cleanString(metadata.github_url) ??
      (githubUsername ? `https://github.com/${githubUsername}` : null),
    avatar_url: cleanString(metadata.avatar_url),
  };
}

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const payload = profileFromUser(user);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingSchemaError(error)) {
      throw new DatabaseSetupError(error.message);
    }

    throw new Error(error.message);
  }

  return data as Profile;
}
