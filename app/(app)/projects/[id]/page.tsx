import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  MessageSquarePlus,
  Users,
  Video,
} from "lucide-react";

import { ProjectCard } from "@/components/pulse/project-card";
import { ReferenceText } from "@/components/pulse/reference-text";
import { ThreadCard } from "@/components/pulse/thread-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { isNotFoundError } from "@/lib/errors";
import { getProjectById } from "@/lib/queries";
import type { ProjectDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const { supabase } = await requireUser();
  let project!: ProjectDetail;

  try {
    project = await getProjectById(supabase, id);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="pulse-focus inline-flex items-center gap-2 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Projects
      </Link>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm text-[var(--accent-strong)]">Project room</p>
            <h1 className="mt-2 text-3xl font-semibold">{project.name}</h1>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
              <ReferenceText value={project.description} />
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {project.repo_url ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={project.repo_url} target="_blank" rel="noreferrer">
                    <GitBranch aria-hidden="true" />
                    Repository
                  </a>
                </Button>
              ) : null}
              {project.live_url ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={project.live_url} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" />
                    Live
                  </a>
                </Button>
              ) : null}
              {project.loom_url ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={project.loom_url} target="_blank" rel="noreferrer">
                    <Video aria-hidden="true" />
                    Loom
                  </a>
                </Button>
              ) : null}
            </div>
          </article>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Associated threads</h2>
              <Button asChild variant="primary" size="sm">
                <Link href={`/threads/new?project_id=${project.id}`}>
                  <MessageSquarePlus aria-hidden="true" />
                  New thread
                </Link>
              </Button>
            </div>
            {project.threads.length ? (
              <div className="grid gap-4">
                {project.threads.map((thread) => (
                  <ThreadCard key={thread.id} thread={{ ...thread, project }} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquarePlus}
                title="No project threads yet"
                description="Attach a help request, project update, or feedback request to this room."
                action={
                  <Button asChild variant="primary">
                    <Link href={`/threads/new?project_id=${project.id}`}>
                      Create thread
                    </Link>
                  </Button>
                }
              />
            )}
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Created</dt>
                <dd>{formatDate(project.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Threads</dt>
                <dd>{project.threads.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Members</dt>
                <dd>{project.members.length}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Members</h2>
            </div>
            {project.members.length ? (
              <div className="mt-4 space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex min-w-0 items-center gap-3">
                    {member.profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                        className="size-8 rounded-[var(--radius-md)]"
                      />
                    ) : (
                      <div className="size-8 rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.profile?.name ??
                          member.profile?.github_username ??
                          "Member"}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {member.profile?.github_username
                          ? `@${member.profile.github_username}`
                          : member.profile?.email ?? "Pulse member"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                No members added yet.
              </p>
            )}
          </section>

          <ProjectCard project={project} />
        </aside>
      </section>
    </div>
  );
}
