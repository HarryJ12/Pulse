"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  generateThreadPromptMarkdown,
  generateThreadSummaryMarkdown,
  generateWeeklyDigestMarkdown,
} from "@/lib/ai";
import { getOpenAIModel } from "@/lib/env";
import { getThreadById, getWeeklyDigestContext } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { nonEmpty, splitTags } from "@/lib/utils";
import { THREAD_STATUSES, THREAD_TYPES, type ThreadStatus, type ThreadType } from "@/lib/types";

type ActionResult = {
  ok: boolean;
  content?: string;
  error?: string;
};

function required(formData: FormData, key: string, label: string) {
  const value = nonEmpty(formData.get(key));
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function optionalUrl(formData: FormData, key: string) {
  const value = nonEmpty(formData.get(key));
  if (!value) return null;
  return value;
}

function parseThreadType(value: string): ThreadType {
  const allowed = THREAD_TYPES.map((item) => item.value);
  if (!allowed.includes(value as ThreadType)) {
    throw new Error("Invalid thread type.");
  }
  return value as ThreadType;
}

function parseThreadStatus(value: string): ThreadStatus {
  const allowed = THREAD_STATUSES.map((item) => item.value);
  if (!allowed.includes(value as ThreadStatus)) {
    throw new Error("Invalid thread status.");
  }
  return value as ThreadStatus;
}

export async function signOutAction() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createThreadAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = required(formData, "title", "Title");
  const body = required(formData, "body", "Body");
  const type = parseThreadType(required(formData, "type", "Type"));
  const projectId = nonEmpty(formData.get("project_id"));

  const { data, error } = await supabase
    .from("threads")
    .insert({
      title,
      body,
      type,
      tags: splitTags(formData.get("tags")),
      project_id: projectId,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/threads");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect(`/threads/${data.id}`);
}

export async function createReplyAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const threadId = required(formData, "thread_id", "Thread");
  const body = required(formData, "body", "Reply");

  const { error } = await supabase.from("replies").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath(`/threads/${threadId}`);
}

export async function createChatMessageAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const body = required(formData, "body", "Message");

  const { error } = await supabase.from("chat_messages").insert({
    author_id: user.id,
    body,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/chat");
}

export async function createProjectAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = required(formData, "name", "Project name");
  const description = required(formData, "description", "Description");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      repo_url: optionalUrl(formData, "repo_url"),
      live_url: optionalUrl(formData, "live_url"),
      loom_url: optionalUrl(formData, "loom_url"),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const selectedMembers = formData
    .getAll("member_ids")
    .filter((value): value is string => typeof value === "string");
  const memberIds = Array.from(new Set([user.id, ...selectedMembers]));

  const { error: memberError } = await supabase.from("project_members").upsert(
    memberIds.map((memberId) => ({
      project_id: data.id,
      user_id: memberId,
    })),
    { onConflict: "project_id,user_id" },
  );

  if (memberError) throw new Error(memberError.message);

  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateThreadStatusAction(formData: FormData) {
  const { supabase } = await requireUser();
  const threadId = required(formData, "thread_id", "Thread");
  const status = parseThreadStatus(required(formData, "status", "Status"));

  const { error } = await supabase
    .from("threads")
    .update({ status })
    .eq("id", threadId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/threads");
  revalidatePath(`/threads/${threadId}`);
}

export async function generateThreadPromptAction(
  threadId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const thread = await getThreadById(supabase, threadId);
    const content = await generateThreadPromptMarkdown(thread);

    const { error } = await supabase.from("generated_prompts").insert({
      thread_id: threadId,
      created_by: user.id,
      content,
      model: getOpenAIModel(),
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/threads/${threadId}`);
    return { ok: true, content };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to generate prompt.",
    };
  }
}

export async function generateThreadSummaryAction(
  threadId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const thread = await getThreadById(supabase, threadId);
    const content = await generateThreadSummaryMarkdown(thread);

    const { error } = await supabase.from("thread_summaries").insert({
      thread_id: threadId,
      created_by: user.id,
      content,
      model: getOpenAIModel(),
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/threads/${threadId}`);
    return { ok: true, content };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to generate summary.",
    };
  }
}

export async function generateWeeklyDigestAction(): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const context = await getWeeklyDigestContext(supabase);
    const content = await generateWeeklyDigestMarkdown(context);
    const title = `Weekly Pulse for ${new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date())}`;

    const { error } = await supabase.from("weekly_digests").insert({
      title,
      content,
      created_by: user.id,
      model: getOpenAIModel(),
    });

    if (error) throw new Error(error.message);

    revalidatePath("/weekly-pulse");
    return { ok: true, content };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to generate digest.",
    };
  }
}
