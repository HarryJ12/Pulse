import { redirect } from "next/navigation";

import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const profile = await ensureProfile(supabase, user);
  return { supabase, user, profile };
}

export async function requireUser() {
  const session = await getCurrentUser();

  if (!session.user || !session.profile) {
    redirect("/login");
  }

  return session as typeof session & {
    user: NonNullable<typeof session.user>;
    profile: NonNullable<typeof session.profile>;
  };
}
