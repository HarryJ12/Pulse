import type { ReactNode } from "react";
import Link from "next/link";
import {
  FolderPlus,
  MessageSquarePlus,
  Newspaper,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/pulse/project-card";
import { ThreadCard } from "@/components/pulse/thread-card";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

type DashboardPanelProps = {
  title: string;
  description: string;
  metric: string | number;
  metricLabel: string;
  actions: ReactNode;
  children: ReactNode;
  className?: string;
};

function DashboardPanel({
  title,
  description,
  metric,
  metricLabel,
  actions,
  children,
  className = "",
}: DashboardPanelProps) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}
    >
      <div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-fit rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5">
            <p className="text-lg font-semibold leading-none">{metric}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{metricLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function HomePage() {
  const { supabase } = await requireUser();
  const data = await getDashboardData(supabase);
  const visibleThreads = data.recentThreads.slice(0, 2);
  const visibleOpenRequests = data.openRequests.slice(0, 2);
  const visibleProjects = data.projects.slice(0, 2);

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <div>
          <p className="text-sm font-medium text-[var(--accent-strong)]">Pulse</p>
          <h1 className="mt-2 text-3xl font-semibold">Cohort workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Structured threads, project context, and manual AI artifacts for
            async technical execution.
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardPanel
          title="Threads"
          description="Durable technical discussions for help, feedback, collaborators, project updates, and resources."
          metric={data.stats.recentThreads}
          metricLabel="total"
          actions={
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/threads">View all</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/threads/new">
                  <MessageSquarePlus aria-hidden="true" />
                  New
                </Link>
              </Button>
            </>
          }
        >
          {data.recentThreads.length ? (
            <div className="grid gap-4">
              {visibleThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquarePlus}
              title="No threads yet"
              description="Start with a help request, project update, or feedback request."
              action={
                <Button asChild variant="primary">
                  <Link href="/threads/new">Create thread</Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Open requests"
          description="Open threads waiting on a reply, decision, or next step."
          metric={data.stats.openRequests}
          metricLabel="open"
          actions={
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/threads?status=open">View all</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/threads/new">
                  <MessageSquarePlus aria-hidden="true" />
                  New thread
                </Link>
              </Button>
            </>
          }
        >
          {data.openRequests.length ? (
            <div className="grid gap-3">
              {visibleOpenRequests.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquarePlus}
              title="No open requests"
              description="Open threads that need attention will appear here."
            />
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardPanel
          title="Projects"
          description="Lightweight rooms that collect context, member activity, and related discussions for a cohort build."
          metric={data.stats.activeProjects}
          metricLabel="active"
          actions={
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/projects">View all</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/projects/new">
                  <FolderPlus aria-hidden="true" />
                  New
                </Link>
              </Button>
            </>
          }
        >
          {data.projects.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderPlus}
              title="No projects yet"
              description="Create rooms for cohort builds, prototypes, or shared experiments."
              action={
                <Button asChild variant="primary">
                  <Link href="/projects/new">Create project</Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Generate summary"
          description="Generate a manual Weekly Pulse summary from the rolling last 7 days of threads, replies, and projects."
          metric={data.stats.recentThreads}
          metricLabel="threads"
          actions={
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/weekly-pulse">View digests</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/weekly-pulse">
                  <Newspaper aria-hidden="true" />
                  Generate
                </Link>
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Open</p>
              <p className="mt-1 text-lg font-semibold">{data.stats.openRequests}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Projects</p>
              <p className="mt-1 text-lg font-semibold">{data.stats.activeProjects}</p>
            </div>
          </div>
        </DashboardPanel>
      </section>
    </div>
  );
}
