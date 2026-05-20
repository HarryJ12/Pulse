import OpenAI from "openai";

import { getOpenAIKey, getOpenAIModel } from "@/lib/env";
import { stripReferenceTokens } from "@/lib/references";
import type { Project, Reply, Thread } from "@/lib/types";
import { threadStatusLabel, threadTypeLabel } from "@/lib/types";

type ThreadContext = Thread & {
  replies: Reply[];
  project?: Project | null;
};

type WeeklyContext = {
  threads: Array<Thread & { replies?: Reply[] }>;
  projects: Project[];
};

function client() {
  return new OpenAI({
    apiKey: getOpenAIKey(),
  });
}

function formatThreadContext(thread: ThreadContext) {
  const replies =
    thread.replies.length > 0
      ? thread.replies
          .map((reply, index) => {
            const author =
              reply.author?.github_username ?? reply.author?.name ?? "Unknown";
            return `Reply ${index + 1} by ${author}:\n${stripReferenceTokens(reply.body)}`;
          })
          .join("\n\n")
      : "No replies yet.";

  const projectContext = thread.project
    ? [
        `Project: ${thread.project.name}`,
        `Description: ${stripReferenceTokens(thread.project.description)}`,
        thread.project.repo_url ? `Repo: ${thread.project.repo_url}` : null,
        thread.project.live_url ? `Live URL: ${thread.project.live_url}` : null,
        thread.project.loom_url ? `Loom: ${thread.project.loom_url}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "No associated project.";

  return `
Thread title: ${thread.title}
Thread type: ${threadTypeLabel(thread.type)}
Status: ${threadStatusLabel(thread.status)}
Tags: ${thread.tags.length ? thread.tags.join(", ") : "None"}
Author: ${thread.author?.github_username ?? thread.author?.name ?? "Unknown"}

Thread body:
${stripReferenceTokens(thread.body)}

Associated project:
${projectContext}

Replies:
${replies}
`.trim();
}

async function completeMarkdown({
  system,
  user,
  maxTokens,
}: {
  system: string;
  user: string;
  maxTokens: number;
}) {
  const completion = await client().chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }
  return content;
}

export async function generateThreadPromptMarkdown(thread: ThreadContext) {
  return completeMarkdown({
    maxTokens: 1200,
    system:
      "You convert technical discussion threads into clean, executable prompts. Return Markdown only. Be precise, avoid filler, and preserve concrete constraints from the discussion.",
    user: `
Create an AI-ready prompt that a builder can paste into Cursor, ChatGPT, or Claude.

The output must use these sections:
- Objective
- Context
- Current problem or task
- Relevant details from discussion
- Constraints
- What has already been tried
- Desired output
- Clear instruction to the AI assistant

Discussion context:
${formatThreadContext(thread)}
`.trim(),
  });
}

export async function generateThreadSummaryMarkdown(thread: ThreadContext) {
  return completeMarkdown({
    maxTokens: 1200,
    system:
      "You summarize async technical discussions for a cohort workspace. Return concise Markdown only. Capture decisions and actionability without inventing facts.",
    user: `
Create a thread summary with these sections:
- TL;DR
- Key decisions
- Open blockers
- Action items
- Useful links/resources mentioned

Discussion context:
${formatThreadContext(thread)}
`.trim(),
  });
}

export async function generateWeeklyDigestMarkdown(context: WeeklyContext) {
  const threads = context.threads
    .map(
      (thread, index) => `
${index + 1}. ${thread.title}
Type: ${threadTypeLabel(thread.type)}
Status: ${threadStatusLabel(thread.status)}
Tags: ${thread.tags?.join(", ") || "None"}
Project: ${thread.project?.name ?? "None"}
Replies: ${thread.replies?.length ?? thread.reply_count ?? 0}
Body: ${stripReferenceTokens(thread.body)}
Recent reply details:
${thread.replies?.length ? thread.replies.map((reply) => `- ${reply.author?.github_username ?? reply.author?.name ?? "Member"}: ${stripReferenceTokens(reply.body)}`).join("\n") : "No replies in this period."}
`.trim(),
    )
    .join("\n\n");

  const projects = context.projects
    .map(
      (project, index) => `
${index + 1}. ${project.name}
Members: ${project.member_count ?? 0}
Threads: ${project.thread_count ?? 0}
Description: ${stripReferenceTokens(project.description)}
`.trim(),
    )
    .join("\n\n");

  return completeMarkdown({
    maxTokens: 1800,
    system:
      "You write concise weekly cohort digests for technical builders. Return Markdown only. Focus on useful coordination signal and unresolved work.",
    user: `
Create a Weekly Pulse digest from the recent cohort activity.

The digest must include:
- Notable discussions
- Unresolved help requests
- Active projects
- Concise cohort summary

Recent threads:
${threads || "No recent threads."}

Recent projects:
${projects || "No recent projects."}
`.trim(),
  });
}
