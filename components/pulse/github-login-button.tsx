"use client";

import { useSearchParams } from "next/navigation";
import { GitBranch, Loader2 } from "lucide-react";
import { Suspense, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { validateSupabasePublicConfig } from "@/lib/env";
import { Button } from "@/components/ui/button";

function GithubLoginButtonInner() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configIssue = validateSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  async function signIn() {
    if (configIssue) {
      setError(configIssue);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const next = searchParams.get("next") || "/";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo,
        },
      });

      if (authError) {
        setError(authError.message);
        setPending(false);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Unable to start GitHub sign in.",
      );
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={signIn}
        disabled={pending || Boolean(configIssue)}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GitBranch aria-hidden="true" />}
        {pending ? "Opening GitHub" : "Continue with GitHub"}
      </Button>
      {configIssue || error ? (
        <p className="rounded-[var(--radius-md)] border border-[rgba(255,143,154,0.32)] bg-[rgba(255,143,154,0.08)] px-3 py-2 text-sm text-[var(--danger)]">
          {error ?? configIssue}
        </p>
      ) : null}
    </div>
  );
}

export function GithubLoginButton() {
  return (
    <Suspense
      fallback={
        <Button type="button" variant="primary" className="w-full" disabled>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Loading sign in
        </Button>
      }
    >
      <GithubLoginButtonInner />
    </Suspense>
  );
}
