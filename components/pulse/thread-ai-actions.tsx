"use client";

import { useRouter } from "next/navigation";
import { FileText, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  generateThreadPromptAction,
  generateThreadSummaryAction,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";

type ThreadAiActionsProps = {
  threadId: string;
  hasPrompt: boolean;
  hasSummary: boolean;
  isOpenAIConfigured: boolean;
};

export function ThreadAiActions({
  threadId,
  hasPrompt,
  hasSummary,
  isOpenAIConfigured,
}: ThreadAiActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [promptPending, startPromptTransition] = useTransition();
  const [summaryPending, startSummaryTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className="w-full"
        disabled={!isOpenAIConfigured || promptPending || summaryPending}
        onClick={() => {
          setError(null);
          startPromptTransition(async () => {
            const result = await generateThreadPromptAction(threadId);
            if (!result.ok) {
              setError(result.error ?? "Unable to generate prompt.");
              return;
            }
            router.refresh();
          });
        }}
      >
        {promptPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : hasPrompt ? (
          <RefreshCw aria-hidden="true" />
        ) : (
          <Wand2 aria-hidden="true" />
        )}
        {promptPending
          ? "Generating prompt"
          : hasPrompt
            ? "Regenerate AI Prompt"
            : "Generate AI Prompt"}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={!isOpenAIConfigured || promptPending || summaryPending}
        onClick={() => {
          setError(null);
          startSummaryTransition(async () => {
            const result = await generateThreadSummaryAction(threadId);
            if (!result.ok) {
              setError(result.error ?? "Unable to generate summary.");
              return;
            }
            router.refresh();
          });
        }}
      >
        {summaryPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : hasSummary ? (
          <RefreshCw aria-hidden="true" />
        ) : (
          <FileText aria-hidden="true" />
        )}
        {summaryPending
          ? "Generating summary"
          : hasSummary
            ? "Regenerate Summary"
            : "Generate Summary"}
      </Button>

      {error ? (
        <p className="rounded-[var(--radius-md)] border border-[rgba(255,143,154,0.32)] bg-[rgba(255,143,154,0.08)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {!isOpenAIConfigured ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add <code>OPENAI_API_KEY</code> to the environment to enable manual AI
          generation.
        </p>
      ) : null}
    </div>
  );
}
