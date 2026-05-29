import { cookies } from "next/headers";
import { LockKeyhole } from "lucide-react";

import {
  cohortAccessCookieName,
  getCohortAccessToken,
  isCohortAccessEnabled,
  safeNextPath,
} from "@/lib/access";
import { unlockCohortAccessAction } from "@/lib/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { GithubLoginButton } from "@/components/pulse/github-login-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function accessErrorMessage(status: string | undefined) {
  if (status === "invalid") {
    return "That cohort password does not match. Check the Discord post and try again.";
  }

  if (status === "not_configured") {
    return "Cohort access is enabled, but no password has been configured in the deployment environment.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = safeNextPath(firstParam(params.next));
  const accessError = accessErrorMessage(firstParam(params.access));
  const accessGateEnabled = isCohortAccessEnabled();
  const cookieStore = await cookies();
  const hasCohortAccess =
    !accessGateEnabled ||
    cookieStore.get(cohortAccessCookieName)?.value ===
      (await getCohortAccessToken());

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] border border-[rgba(16,194,129,0.38)] bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent-strong)]">
            P
          </div>
          <div>
            <h1 className="text-xl font-semibold">Pulse</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Turn conversations into execution.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            {hasCohortAccess ? "Sign in to your cohort" : "Enter cohort password"}
          </h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {hasCohortAccess
              ? "Use GitHub to join structured discussions, project rooms, and manual AI summaries for your builder cohort."
              : "Pulse is available to cohort members. Use the password shared in Discord, then continue with GitHub."}
          </p>
        </div>

        <div className="mt-6">
          {hasCohortAccess ? (
            <GithubLoginButton />
          ) : (
            <form action={unlockCohortAccessAction} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <div className="space-y-2">
                <Label htmlFor="access_password">Cohort password</Label>
                <Input
                  id="access_password"
                  name="access_password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password from Discord"
                  required
                />
              </div>
              {accessError ? (
                <p className="rounded-[var(--radius-md)] border border-[rgba(255,143,154,0.32)] bg-[rgba(255,143,154,0.08)] px-3 py-2 text-sm text-[var(--danger)]">
                  {accessError}
                </p>
              ) : null}
              <SubmitButton
                type="submit"
                variant="primary"
                className="w-full"
                pendingLabel="Checking password"
              >
                <LockKeyhole aria-hidden="true" />
                Unlock Pulse
              </SubmitButton>
            </form>
          )}
        </div>

      </section>
    </main>
  );
}
