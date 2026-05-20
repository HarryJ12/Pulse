import { Newspaper } from "lucide-react";

import { MarkdownBlock } from "@/components/pulse/markdown-block";
import { WeeklyDigestButton } from "@/components/pulse/weekly-digest-button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { isOpenAIConfigured } from "@/lib/env";
import { getWeeklyDigests } from "@/lib/queries";

export default async function WeeklyPulsePage() {
  const { supabase } = await requireUser();
  const digests = await getWeeklyDigests(supabase);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Weekly Pulse</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Generate a manual cohort digest from the rolling last 7 days of
            threads, replies, and projects.
          </p>
        </div>
        <WeeklyDigestButton isOpenAIConfigured={isOpenAIConfigured()} />
      </header>

      {digests.length ? (
        <div className="space-y-4">
          {digests.map((digest) => (
            <MarkdownBlock
              key={digest.id}
              title={digest.title}
              content={digest.content}
              createdAt={digest.created_at}
              model={digest.model}
              copyMarkdown
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No weekly digests yet"
          description="Generate the first digest when the cohort has enough recent activity to summarize."
        />
      )}
    </div>
  );
}
