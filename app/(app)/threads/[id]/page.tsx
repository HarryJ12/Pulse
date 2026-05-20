import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderKanban, GitBranch, MessageSquare, Tag } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { MarkdownBlock } from "@/components/pulse/markdown-block";
import { MentionTextarea } from "@/components/pulse/mention-textarea";
import { ReferenceText } from "@/components/pulse/reference-text";
import { ThreadAiActions } from "@/components/pulse/thread-ai-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createReplyAction, updateThreadStatusAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { isOpenAIConfigured } from "@/lib/env";
import { isNotFoundError } from "@/lib/errors";
import { getMentionTargets, getThreadById } from "@/lib/queries";
import {
  THREAD_STATUSES,
  threadStatusLabel,
  threadTypeLabel,
  type MentionTarget,
  type ThreadDetail,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type ThreadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  let thread!: ThreadDetail;
  let mentionTargets!: MentionTarget[];

  try {
    [thread, mentionTargets] = await Promise.all([
      getThreadById(supabase, id),
      getMentionTargets(supabase),
    ]);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }
  const latestPrompt = thread.generated_prompts[0];
  const latestSummary = thread.thread_summaries[0];
  const isAuthor = thread.author_id === user.id;

  return (
    <div className="space-y-6">
      <Link
        href="/threads"
        className="pulse-focus inline-flex items-center gap-2 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Threads
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
            <header className="border-b border-[var(--border)] p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="default">{threadTypeLabel(thread.type)}</Badge>
                <Badge
                  variant={
                    thread.status === "resolved"
                      ? "success"
                      : thread.status === "archived"
                        ? "warning"
                        : "accent"
                  }
                >
                  {threadStatusLabel(thread.status)}
                </Badge>
                {thread.project ? (
                  <Badge variant="accent">{thread.project.name}</Badge>
                ) : null}
              </div>
              <h1 className="text-3xl font-semibold">{thread.title}</h1>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Opened by {thread.author?.name ?? thread.author?.github_username ?? "Unknown"} ·{" "}
                {formatDateTime(thread.created_at)}
              </p>
            </header>
            <div className="prose-pulse whitespace-pre-wrap p-5 text-sm">
              <ReferenceText value={thread.body} />
            </div>
          </article>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Replies</h2>
              <span className="text-sm text-[var(--text-muted)]">
                {thread.replies.length}
              </span>
            </div>

            {thread.replies.length ? (
              <div className="space-y-3">
                {thread.replies.map((reply) => (
                  <article
                    key={reply.id}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-[var(--text-primary)]">
                        {reply.author?.name ??
                          reply.author?.github_username ??
                          "Unknown"}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDateTime(reply.created_at)}
                      </span>
                    </div>
                    <div className="prose-pulse whitespace-pre-wrap text-sm">
                      <ReferenceText value={reply.body} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No replies yet"
                description="Add the first response with concrete context, suggestions, or links."
              />
            )}

            <form
              action={createReplyAction}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <input type="hidden" name="thread_id" value={thread.id} />
              <label
                htmlFor="body"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                Add reply
              </label>
              <MentionTextarea
                id="body"
                name="body"
                required
                rows={6}
                targets={mentionTargets}
                placeholder="Add context, a proposed fix, a decision, or next step."
              />
              <div className="mt-4 flex justify-end">
                <SubmitButton variant="primary" pendingLabel="Posting reply">
                  Post reply
                </SubmitButton>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Generated artifacts</h2>
            {latestPrompt ? (
              <MarkdownBlock
                title="Latest AI prompt"
                content={latestPrompt.content}
                createdAt={latestPrompt.created_at}
                model={latestPrompt.model}
                copyMarkdown
              />
            ) : null}
            {latestSummary ? (
              <MarkdownBlock
                title="Latest summary"
                content={latestSummary.content}
                createdAt={latestSummary.created_at}
                model={latestSummary.model}
              />
            ) : null}
            {!latestPrompt && !latestSummary ? (
              <EmptyState
                icon={MessageSquare}
                title="No AI artifacts yet"
                description="Generate a prompt or summary manually from the action panel."
              />
            ) : null}

            {thread.generated_prompts.length > 1 ||
            thread.thread_summaries.length > 1 ? (
              <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
                  Previously generated artifacts
                </summary>
                <div className="mt-4 space-y-4">
                  {thread.generated_prompts.slice(1).map((prompt) => (
                    <MarkdownBlock
                      key={prompt.id}
                      title="AI prompt"
                      content={prompt.content}
                      createdAt={prompt.created_at}
                      model={prompt.model}
                      copyMarkdown
                    />
                  ))}
                  {thread.thread_summaries.slice(1).map((summary) => (
                    <MarkdownBlock
                      key={summary.id}
                      title="Summary"
                      content={summary.content}
                      createdAt={summary.created_at}
                      model={summary.model}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold">AI actions</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Manual generation only. Outputs are saved so they can be reused
              without another API call.
            </p>
            <div className="mt-4">
              <ThreadAiActions
                threadId={thread.id}
                hasPrompt={thread.generated_prompts.length > 0}
                hasSummary={thread.thread_summaries.length > 0}
                isOpenAIConfigured={isOpenAIConfigured()}
              />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold">Thread details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Status</dt>
                <dd className="font-medium">{threadStatusLabel(thread.status)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Type</dt>
                <dd className="font-medium">{threadTypeLabel(thread.type)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Updated</dt>
                <dd className="font-medium">{formatDateTime(thread.updated_at)}</dd>
              </div>
            </dl>

            {isAuthor ? (
              <form action={updateThreadStatusAction} className="mt-5 flex gap-2">
                <input type="hidden" name="thread_id" value={thread.id} />
                <select
                  name="status"
                  defaultValue={thread.status}
                  className="pulse-focus h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {THREAD_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <SubmitButton size="sm" pendingLabel="Saving">
                  Save
                </SubmitButton>
              </form>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Project</h2>
            </div>
            {thread.project ? (
              <div className="mt-3">
                <Link
                  href={`/projects/${thread.project.id}`}
                  className="pulse-focus text-sm font-medium text-[var(--accent-strong)] hover:underline"
                >
                  {thread.project.name}
                </Link>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  <ReferenceText value={thread.project.description} />
                </p>
                {thread.project.repo_url ? (
                  <Button asChild variant="secondary" size="sm" className="mt-4">
                    <a href={thread.project.repo_url} target="_blank" rel="noreferrer">
                      <GitBranch aria-hidden="true" />
                      Repository link
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                This thread is not attached to a project.
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Tags</h2>
            </div>
            {thread.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {thread.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/threads?tag=${encodeURIComponent(tag)}`}
                    className="pulse-focus rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                No tags were added.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
