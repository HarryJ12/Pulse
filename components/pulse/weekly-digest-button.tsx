"use client";

import { Loader2, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { generateWeeklyDigestAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

type WeeklyDigestButtonProps = {
  isOpenAIConfigured: boolean;
};

export function WeeklyDigestButton({ isOpenAIConfigured }: WeeklyDigestButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        type="button"
        disabled={!isOpenAIConfigured || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await generateWeeklyDigestAction();
            if (!result.ok) {
              setError(result.error ?? "Unable to generate digest.");
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Newspaper aria-hidden="true" />
        )}
        {pending ? "Generating digest" : "Generate Weekly Digest"}
      </Button>
      {error ? (
        <p className="rounded-[var(--radius-md)] border border-[rgba(255,143,154,0.32)] bg-[rgba(255,143,154,0.08)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {!isOpenAIConfigured ? (
        <p className="max-w-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add <code>OPENAI_API_KEY</code> to the environment to enable digest
          generation.
        </p>
      ) : null}
    </div>
  );
}
