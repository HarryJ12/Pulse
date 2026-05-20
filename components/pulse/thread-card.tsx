import Link from "next/link";
import { MessageSquare, Timer } from "lucide-react";

import type { Thread } from "@/lib/types";
import { threadStatusLabel, threadTypeLabel } from "@/lib/types";
import { stripReferenceTokens } from "@/lib/references";
import { formatDateTime, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ThreadCard({ thread }: { thread: Thread }) {
  const statusVariant =
    thread.status === "resolved"
      ? "success"
      : thread.status === "archived"
        ? "warning"
        : "accent";

  return (
    <Link
      href={`/threads/${thread.id}`}
      className="pulse-focus block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-[border-color,background,transform] duration-150 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{threadTypeLabel(thread.type)}</Badge>
        <Badge variant={statusVariant}>{threadStatusLabel(thread.status)}</Badge>
        {thread.project ? <Badge variant="accent">{thread.project.name}</Badge> : null}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{thread.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {truncate(stripReferenceTokens(thread.body), 190)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
        <span>{thread.author?.name ?? thread.author?.github_username ?? "Unknown"}</span>
        <span className="flex items-center gap-1">
          <Timer className="size-3.5" aria-hidden="true" />
          {formatDateTime(thread.updated_at)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          {thread.reply_count ?? 0}
        </span>
      </div>
      {thread.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
