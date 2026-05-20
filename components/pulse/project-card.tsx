import Link from "next/link";
import { GitBranch, MessageSquare, Users } from "lucide-react";

import type { Project } from "@/lib/types";
import { stripReferenceTokens } from "@/lib/references";
import { formatDate, truncate } from "@/lib/utils";

export function ProjectCard({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="pulse-focus block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-[border-color,background,transform] duration-150 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)] data-[compact=true]:p-4"
      data-compact={compact}
    >
      <h3 className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>
        {project.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {truncate(stripReferenceTokens(project.description), compact ? 110 : 160)}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-[var(--text-muted)]">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <Users className="size-3.5" aria-hidden="true" />
          {project.member_count ?? 0}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          {project.thread_count ?? 0}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <GitBranch className="size-3.5" aria-hidden="true" />
          {project.repo_url ? "Repository" : "No repository"}
        </span>
      </div>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Created {formatDate(project.created_at)}
      </p>
    </Link>
  );
}
