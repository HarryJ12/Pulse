"use client";

import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSupabaseProjectRef } from "@/lib/env";

type DatabaseSetupRequiredProps = {
  detail?: string;
};

export function DatabaseSetupRequired({ detail }: DatabaseSetupRequiredProps) {
  const projectRef = getSupabaseProjectRef();
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : "https://supabase.com/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--text-primary)]">
      <section className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[rgba(16,194,129,0.38)] bg-[var(--accent-muted)]">
            <Database className="size-5 text-[var(--accent-strong)]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--accent-strong)]">
              Database setup required
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Run the Pulse Supabase schema
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              GitHub sign-in is connected, but this Supabase project does not
              have the Pulse tables yet. Install the migrations, then refresh
              this page.
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
          <li>1. Open your Supabase project dashboard.</li>
          <li>2. Go to SQL Editor.</li>
          <li>
            3. Paste and run the SQL files in order from{" "}
            <code className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[var(--text-primary)]">
              supabase/migrations
            </code>
            .
          </li>
          <li>4. Refresh Pulse on localhost.</li>
        </ol>

        {detail ? (
          <p className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-xs leading-5 text-[var(--text-muted)]">
            Supabase said: {detail}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" />
              Open SQL editor
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
