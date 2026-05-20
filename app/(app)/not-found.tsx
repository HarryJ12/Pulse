import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-sm font-medium text-[var(--accent-strong)]">Not found</p>
        <h1 className="mt-2 text-2xl font-semibold">This Pulse page is not here</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          The thread, project, or profile may have been moved, archived, or deleted.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
