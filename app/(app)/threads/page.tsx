import Link from "next/link";
import { MessageSquarePlus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ThreadCard } from "@/components/pulse/thread-card";
import { requireUser } from "@/lib/auth";
import { getProjects, getThreads } from "@/lib/queries";
import { THREAD_STATUSES, THREAD_TYPES } from "@/lib/types";

type ThreadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThreadsPage({ searchParams }: ThreadsPageProps) {
  const params = (await searchParams) ?? {};
  const filters = {
    search: valueOf(params.q),
    type: valueOf(params.type),
    status: valueOf(params.status),
    project: valueOf(params.project),
    tag: valueOf(params.tag),
    sort: valueOf(params.sort) ?? "newest",
  };

  const { supabase } = await requireUser();
  const [threads, projects] = await Promise.all([
    getThreads(supabase, filters),
    getProjects(supabase),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Threads</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Durable technical discussions for help, feedback, collaborators,
            project updates, and resources.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/threads/new">
            <MessageSquarePlus aria-hidden="true" />
            New thread
          </Link>
        </Button>
      </header>

      <form className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))_auto]">
        <label className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="Search title, body, tags"
            className="pl-9"
          />
        </label>
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="pulse-focus h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
        >
          <option value="">All types</option>
          {THREAD_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="pulse-focus h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
        >
          <option value="">All statuses</option>
          {THREAD_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          name="project"
          defaultValue={filters.project ?? ""}
          className="pulse-focus h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <Input name="tag" defaultValue={filters.tag ?? ""} placeholder="Tag" />
        <select
          name="sort"
          defaultValue={filters.sort}
          className="pulse-focus h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
        >
          <option value="newest">Newest activity</option>
          <option value="oldest">Oldest first</option>
          <option value="most_active">Most active</option>
        </select>
        <Button type="submit">Apply</Button>
      </form>

      {threads.length ? (
        <div className="grid gap-4">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquarePlus}
          title="No matching threads"
          description="Adjust the filters or create a new structured discussion."
          action={
            <Button asChild variant="primary">
              <Link href="/threads/new">Create thread</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
