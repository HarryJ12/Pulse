"use client";

import { DatabaseSetupRequired } from "@/components/pulse/database-setup-required";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  const message = error.message || "Unknown app error";
  const isSchemaIssue =
    message.includes("schema") ||
    message.includes("public.") ||
    message.includes("Pulse database schema");

  if (isSchemaIssue) {
    return <DatabaseSetupRequired detail={message} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--text-primary)]">
      <section className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm font-medium text-[var(--danger)]">Pulse error</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Something needs attention
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {message}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="pulse-focus mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-sm font-medium text-[var(--text-primary)] transition-[background,transform] duration-150 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:bg-[var(--surface-muted)]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
