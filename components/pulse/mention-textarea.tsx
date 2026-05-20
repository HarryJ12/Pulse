"use client";

import type React from "react";
import { AtSign, FolderKanban, MessageSquareText, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatReferenceToken } from "@/lib/references";
import type { MentionKind, MentionTarget } from "@/lib/types";
import { cn } from "@/lib/utils";

type MentionTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  targets: MentionTarget[];
};

type AutocompleteState = {
  query: string;
  start: number;
  end: number;
  trigger: "@" | "#";
};

const tabs: Array<{
  kind: MentionKind;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  { kind: "person", label: "People", icon: AtSign },
  { kind: "project", label: "Projects", icon: FolderKanban },
  { kind: "thread", label: "Threads", icon: MessageSquareText },
];

export function MentionTextarea({
  targets,
  className,
  onBlur,
  onChange,
  onKeyDown,
  onSelect,
  onClick,
  ...props
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeKind, setActiveKind] = useState<MentionKind>("person");
  const [query, setQuery] = useState("");
  const [autocomplete, setAutocomplete] = useState<AutocompleteState | null>(null);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(0);

  const peopleTargets = useMemo(
    () => targets.filter((target) => target.kind === "person"),
    [targets],
  );
  const projectAndThreadTargets = useMemo(
    () => targets.filter((target) => target.kind === "project" || target.kind === "thread"),
    [targets],
  );

  const filteredTargets = useMemo(() => {
    const search = query.trim().toLowerCase();

    return targets
      .filter((target) => target.kind === activeKind)
      .filter((target) => {
        if (!search) return true;
        return `${target.label} ${target.detail}`.toLowerCase().includes(search);
      })
      .slice(0, 8);
  }, [activeKind, query, targets]);

  const autocompleteTargets = useMemo(() => {
    if (!autocomplete) return [];

    const search = autocomplete.query.toLowerCase();

    const sourceTargets =
      autocomplete.trigger === "@" ? peopleTargets : projectAndThreadTargets;

    return sourceTargets
      .map((target) => {
        const label = target.label
          .toLowerCase()
          .replace(/^@/, "")
          .replace(/^#/, "");
        const detail = target.detail.toLowerCase();
        const haystack = `${label} ${detail}`;
        let rank = 4;

        if (!search) rank = 3;
        else if (label.startsWith(search)) rank = 0;
        else if (detail.startsWith(search)) rank = 1;
        else if (haystack.includes(search)) rank = 2;

        return { target, rank };
      })
      .filter((item) => item.rank < 4)
      .sort((a, b) => a.rank - b.rank || a.target.label.localeCompare(b.target.label))
      .slice(0, 6)
      .map((item) => item.target);
  }, [autocomplete, peopleTargets, projectAndThreadTargets]);

  function getAutocompleteState(textarea: HTMLTextAreaElement) {
    const cursor = textarea.selectionStart ?? textarea.value.length;
    const beforeCursor = textarea.value.slice(0, cursor);
    const match = beforeCursor.match(/(?:^|\s)([@#])([A-Za-z0-9_-]{0,48})$/);

    if (!match) return null;

    const trigger = match[1] as "@" | "#";
    const queryText = match[2] ?? "";
    return {
      query: queryText,
      start: cursor - queryText.length - trigger.length,
      end: cursor,
      trigger,
    };
  }

  function updateAutocomplete(textarea: HTMLTextAreaElement) {
    const nextAutocomplete = getAutocompleteState(textarea);
    setAutocomplete(nextAutocomplete);
    setActiveAutocompleteIndex(0);
  }

  function insertReference(target: MentionTarget, range?: AutocompleteState) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const token = `${formatReferenceToken(target)} `;
    const start = range?.start ?? textarea.selectionStart ?? textarea.value.length;
    const end = range?.end ?? textarea.selectionEnd ?? textarea.value.length;
    textarea.setRangeText(token, start, end, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    setAutocomplete(null);
    textarea.focus();
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          className={className}
          onBlur={(event) => {
            onBlur?.(event);
            window.setTimeout(() => setAutocomplete(null), 120);
          }}
          onChange={(event) => {
            onChange?.(event);
            updateAutocomplete(event.currentTarget);
          }}
          onClick={(event) => {
            onClick?.(event);
            updateAutocomplete(event.currentTarget);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);

            if (!autocomplete || !autocompleteTargets.length) return;

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveAutocompleteIndex((current) =>
                current + 1 >= autocompleteTargets.length ? 0 : current + 1,
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveAutocompleteIndex((current) =>
                current - 1 < 0 ? autocompleteTargets.length - 1 : current - 1,
              );
              return;
            }

            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              insertReference(
                autocompleteTargets[activeAutocompleteIndex] ?? autocompleteTargets[0],
                autocomplete,
              );
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setAutocomplete(null);
            }
          }}
          onSelect={(event) => {
            onSelect?.(event);
            updateAutocomplete(event.currentTarget);
          }}
          {...props}
        />

        {autocomplete && autocompleteTargets.length ? (
          <div className="absolute left-3 right-3 top-full z-20 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] shadow-2xl shadow-black/30">
            <div className="border-b border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
              {autocomplete.trigger === "@"
                ? `People matching @${autocomplete.query || "people"}`
                : `Projects and threads matching #${autocomplete.query || "reference"}`}
            </div>
            <div className="max-h-56 overflow-y-auto p-1.5">
              {autocompleteTargets.map((target, index) => (
                <button
                  key={`${target.kind}-${target.id}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertReference(target, autocomplete);
                  }}
                  className={cn(
                    "pulse-focus flex w-full min-w-0 flex-col rounded-[var(--radius-md)] px-3 py-2 text-left transition-colors duration-150 ease-[var(--ease-standard)]",
                    index === activeAutocompleteIndex
                      ? "bg-[var(--accent-muted)] text-[var(--accent-strong)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <span className="truncate text-sm font-medium">{target.label}</span>
                  <span className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                    {target.detail}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.kind === activeKind;

            return (
              <button
                key={tab.kind}
                type="button"
                onClick={() => setActiveKind(tab.kind)}
                className={cn(
                  "pulse-focus inline-flex h-8 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-xs font-medium transition-colors duration-150 ease-[var(--ease-standard)]",
                  isActive
                    ? "border-[rgba(16,194,129,0.42)] bg-[var(--accent-muted)] text-[var(--accent-strong)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon className="size-3.5" aria-hidden={true} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="relative mt-3 block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a reference"
            className="h-9 pl-9"
          />
        </label>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {filteredTargets.map((target) => (
            <button
              key={`${target.kind}-${target.id}`}
              type="button"
              onClick={() => insertReference(target)}
              className="pulse-focus min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left transition-[border-color,background,transform] duration-150 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
            >
              <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                {target.label}
              </span>
              <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                {target.detail}
              </span>
            </button>
          ))}
        </div>

        {!filteredTargets.length ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)]">
            No references found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
