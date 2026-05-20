import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch, Mail, UserCircle } from "lucide-react";

import { ProjectCard } from "@/components/pulse/project-card";
import { ThreadCard } from "@/components/pulse/thread-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { getPersonById } from "@/lib/queries";
import type { PersonDetail } from "@/lib/types";
import { formatDate, getInitials } from "@/lib/utils";

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const { supabase } = await requireUser();
  let person!: PersonDetail;

  try {
    person = await getPersonById(supabase, id);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  const { profile, threads, projects } = person;

  return (
    <div className="space-y-6">
      <Link
        href="/chat"
        className="pulse-focus inline-flex items-center gap-2 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Chat
      </Link>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="size-16 rounded-[var(--radius-lg)] object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-muted)] text-lg font-semibold">
                {getInitials(profile.name)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold">
                {profile.name ?? "Pulse member"}
              </h1>
              <p className="truncate text-sm text-[var(--text-muted)]">
                {profile.github_username
                  ? `@${profile.github_username}`
                  : "Cohort member"}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Joined</dt>
              <dd>{formatDate(profile.created_at)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Threads</dt>
              <dd>{threads.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Projects</dt>
              <dd>{projects.length}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-3">
            {profile.github_url ? (
              <Button asChild className="w-full justify-start" variant="secondary">
                <a href={profile.github_url} target="_blank" rel="noreferrer">
                  <GitBranch aria-hidden="true" />
                  GitHub
                </a>
              </Button>
            ) : null}
            {profile.email ? (
              <Button asChild className="w-full justify-start" variant="ghost">
                <a href={`mailto:${profile.email}`}>
                  <Mail aria-hidden="true" />
                  {profile.email}
                </a>
              </Button>
            ) : null}
          </div>
        </aside>

        <main className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Recent threads</h2>
            {threads.length ? (
              <div className="grid gap-4">
                {threads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={UserCircle}
                title="No threads yet"
                description="Authored discussions from this person will appear here."
              />
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Projects</h2>
            {projects.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={UserCircle}
                title="No projects yet"
                description="Project rooms that include this person will appear here."
              />
            )}
          </section>
        </main>
      </section>
    </div>
  );
}
