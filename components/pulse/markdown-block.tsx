"use client";

import { useMemo, useState } from "react";

import { CopyButton } from "@/components/pulse/copy-button";
import { cn, formatDateTime } from "@/lib/utils";

type MarkdownBlockProps = {
  title: string;
  content: string;
  createdAt?: string;
  model?: string;
  copyMarkdown?: boolean;
};

type DisplayMode = "human" | "markdown";

type HumanBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^\s*>\s?/, "")
    .trim();
}

function parseHumanBlocks(content: string): HumanBlock[] {
  const blocks: HumanBlock[] = [];
  const paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({
      type: "paragraph",
      text: cleanInlineMarkdown(paragraph.join(" ")),
    });
    paragraph.length = 0;
  }

  function flushList() {
    if (!listItems.length) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  }

  content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        blocks.push({ type: "heading", text: cleanInlineMarkdown(heading[1]) });
        return;
      }

      const listItem = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
      if (listItem) {
        flushParagraph();
        listItems.push(cleanInlineMarkdown(listItem[1]));
        return;
      }

      flushList();
      paragraph.push(trimmed);
    });

  flushParagraph();
  flushList();

  return blocks;
}

function markdownToPlainText(content: string) {
  return parseHumanBlocks(content)
    .map((block) => {
      if (block.type === "list") {
        return block.items.map((item) => `- ${item}`).join("\n");
      }

      return block.text;
    })
    .join("\n\n");
}

function HumanMarkdownView({ content }: { content: string }) {
  const blocks = useMemo(() => parseHumanBlocks(content), [content]);

  return (
    <div className="prose-pulse space-y-4 px-4 py-4 text-sm">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 key={`${block.text}-${index}`} className="text-sm font-semibold">
              {block.text}
            </h3>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 pl-7"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block.text}-${index}`} className="leading-6">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export function MarkdownBlock({
  title,
  content,
  createdAt,
  model,
  copyMarkdown,
}: MarkdownBlockProps) {
  const [mode, setMode] = useState<DisplayMode>("human");
  const humanContent = useMemo(() => markdownToPlainText(content), [content]);
  const displayedContent = mode === "human" ? humanContent : content;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {createdAt ? (
            <p className="text-xs text-[var(--text-muted)]">
              {formatDateTime(createdAt)}
              {model ? ` · ${model}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-1">
            {(["human", "markdown"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={cn(
                  "pulse-focus h-7 rounded-[var(--radius-sm)] px-2.5 text-xs font-medium capitalize transition-colors duration-150 ease-[var(--ease-standard)]",
                  mode === option
                    ? "bg-[var(--accent)] text-[#041111]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
                aria-pressed={mode === option}
              >
                {option}
              </button>
            ))}
          </div>
          <CopyButton value={displayedContent} />
          {copyMarkdown && mode === "human" ? (
            <CopyButton value={content} label="Copy Markdown" />
          ) : null}
        </div>
      </div>
      {mode === "human" ? (
        <HumanMarkdownView content={content} />
      ) : (
        <div className="prose-pulse whitespace-pre-wrap px-4 py-4 font-mono text-xs leading-6">
          {content}
        </div>
      )}
    </section>
  );
}
