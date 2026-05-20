import { MessageCircle, MessagesSquare } from "lucide-react";

import { MentionTextarea } from "@/components/pulse/mention-textarea";
import { ReferenceText } from "@/components/pulse/reference-text";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { createChatMessageAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getChatMessages, getMentionTargets } from "@/lib/queries";
import { formatDateTime, getInitials } from "@/lib/utils";

export default async function ChatPage() {
  const { supabase, user } = await requireUser();
  const [messages, mentionTargets] = await Promise.all([
    getChatMessages(supabase),
    getMentionTargets(supabase),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Chat</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            A lightweight cohort backchannel for quick notes that still connect
            back to people, projects, and threads.
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main>
          {messages.length ? (
            <div className="max-h-[calc(100vh-14rem)] min-h-[28rem] overflow-y-auto overscroll-contain scroll-smooth rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 pr-3 sm:p-5 sm:pr-4">
              <div className="space-y-3 pr-1">
                {messages.map((message) => {
                  const isOwnMessage = message.author_id === user.id;
                  const authorName =
                    message.author?.name ??
                    message.author?.github_username ??
                    "Pulse member";
                  const authorHandle = message.author?.github_username
                    ? `@${message.author.github_username}`
                    : "Cohort member";

                  return (
                    <article
                      key={message.id}
                      className={`flex items-end gap-3 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOwnMessage ? (
                        message.author?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={message.author.avatar_url}
                            alt=""
                            className="size-9 shrink-0 rounded-[var(--radius-md)] object-cover"
                          />
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs font-semibold">
                            {getInitials(message.author?.name)}
                          </div>
                        )
                      ) : null}

                      <div
                        className={`max-w-[min(32rem,74%)] rounded-[var(--radius-lg)] px-3 py-2 shadow-sm ${
                          isOwnMessage
                            ? "border border-[rgba(16,194,129,0.32)] bg-[var(--accent-muted)]"
                            : "border border-[var(--border)] bg-[var(--surface)]"
                        }`}
                      >
                        <div
                          className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 ${
                            isOwnMessage ? "justify-end text-right" : "justify-start"
                          }`}
                        >
                          <p className="max-w-full truncate text-xs font-semibold text-[var(--text-primary)]">
                            {isOwnMessage ? "You" : authorName}
                          </p>
                          {!isOwnMessage ? (
                            <p className="truncate text-xs text-[var(--text-muted)]">
                              {authorHandle}
                            </p>
                          ) : null}
                          <time className="text-xs text-[var(--text-muted)]">
                            {formatDateTime(message.created_at)}
                          </time>
                        </div>
                        <div className="prose-pulse whitespace-pre-wrap text-sm leading-5">
                          <ReferenceText value={message.body} />
                        </div>
                      </div>

                      {isOwnMessage ? (
                        message.author?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={message.author.avatar_url}
                            alt=""
                            className="size-9 shrink-0 rounded-[var(--radius-md)] object-cover"
                          />
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] text-xs font-semibold text-[var(--accent-strong)]">
                            {getInitials(message.author?.name)}
                          </div>
                        )
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="No chat messages yet"
              description="Start the cohort backchannel with a quick project note, thread reference, or person mention."
            />
          )}
        </main>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <form
            action={createChatMessageAction}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="size-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">New message</h2>
            </div>
            <MentionTextarea
              id="body"
              name="body"
              aria-label="Message body"
              required
              rows={7}
              targets={mentionTargets}
              placeholder="Share a quick update, question, or reference."
            />
            <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
              <SubmitButton variant="primary" pendingLabel="Posting message">
                Post message
              </SubmitButton>
            </div>
          </form>
        </aside>
      </section>
    </div>
  );
}
