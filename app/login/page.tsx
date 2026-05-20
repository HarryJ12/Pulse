import { GithubLoginButton } from "@/components/pulse/github-login-button";

export default function LoginPage() {
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
          <h2 className="text-2xl font-semibold">Sign in to your cohort</h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Use GitHub to join structured discussions, project rooms, and
            manual AI summaries for your builder cohort.
          </p>
        </div>

        <div className="mt-6">
          <GithubLoginButton />
        </div>

        <p className="mt-6 text-xs leading-5 text-[var(--text-muted)]">
          Pulse uses Supabase Auth. API keys and OAuth secrets must stay in
          environment variables, not source code.
        </p>
      </section>
    </main>
  );
}
