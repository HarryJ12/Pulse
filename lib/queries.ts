import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ChatMessage,
  GeneratedPrompt,
  MentionTarget,
  PersonDetail,
  Profile,
  Project,
  ProjectDetail,
  ProjectMember,
  Reply,
  Thread,
  ThreadDetail,
  ThreadSummary,
  WeeklyDigest,
} from "@/lib/types";
import { threadTypeLabel } from "@/lib/types";

export type ThreadFilters = {
  search?: string;
  type?: string;
  status?: string;
  project?: string;
  tag?: string;
  sort?: string;
};

const profileSelect =
  "id,name,email,github_username,github_url,avatar_url,created_at";

type ThreadRow = Omit<Thread, "author" | "project" | "reply_count"> & {
  author?: Profile | null;
  project?: Project | null;
  replies?: unknown;
};

type ProjectRow = Omit<Project, "creator" | "member_count" | "thread_count"> & {
  creator?: Profile | null;
  project_members?: unknown;
  threads?: unknown;
};

function firstCount(value: unknown) {
  if (Array.isArray(value)) {
    const count = value[0]?.count;
    return typeof count === "number" ? count : 0;
  }
  return 0;
}

function repliesSince(value: unknown, since: Date) {
  if (!Array.isArray(value)) return [];

  const sinceTime = since.getTime();
  return value.filter((reply) => {
    const createdAt =
      typeof reply?.created_at === "string" ? Date.parse(reply.created_at) : NaN;
    return Number.isFinite(createdAt) && createdAt >= sinceTime;
  });
}

function normalizeThread(row: ThreadRow): Thread {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    status: row.status,
    tags: row.tags ?? [],
    project_id: row.project_id,
    author_id: row.author_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author ?? null,
    project: row.project ?? null,
    reply_count: firstCount(row.replies),
  };
}

function normalizeProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    repo_url: row.repo_url,
    live_url: row.live_url,
    loom_url: row.loom_url,
    created_by: row.created_by,
    created_at: row.created_at,
    creator: row.creator ?? null,
    member_count: firstCount(row.project_members),
    thread_count: firstCount(row.threads),
  };
}

function profileLabel(profile: Profile) {
  if (profile.github_username) return `@${profile.github_username}`;
  return profile.name ?? profile.email ?? "Pulse member";
}

function profileDetail(profile: Profile) {
  if (profile.name && profile.github_username) return profile.name;
  return profile.email ?? "Cohort member";
}

export async function getThreads(
  supabase: SupabaseClient,
  filters: ThreadFilters = {},
) {
  let query = supabase
    .from("threads")
    .select(
      `
      *,
      author:profiles!threads_author_id_fkey(${profileSelect}),
      project:projects!threads_project_id_fkey(*),
      replies(count)
    `,
    )
    .limit(1000);

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.project) query = query.eq("project_id", filters.project);
  if (filters.tag) query = query.contains("tags", [filters.tag.toLowerCase()]);

  query =
    filters.sort === "oldest"
      ? query.order("created_at", { ascending: true })
      : query.order("updated_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let threads = (data ?? []).map(normalizeThread);
  const search = filters.search?.trim().toLowerCase();

  if (search) {
    threads = threads.filter((thread) => {
      const haystack = [
        thread.title,
        thread.body,
        thread.author?.name,
        thread.author?.github_username,
        thread.project?.name,
        ...(thread.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }

  if (filters.sort === "most_active") {
    threads = threads.sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0));
  }

  return threads;
}

export async function getThreadById(supabase: SupabaseClient, id: string) {
  const { data: threadRow, error: threadError } = await supabase
    .from("threads")
    .select(
      `
      *,
      author:profiles!threads_author_id_fkey(${profileSelect}),
      project:projects!threads_project_id_fkey(*)
    `,
    )
    .eq("id", id)
    .single();

  if (threadError) throw new Error(threadError.message);

  const [
    { data: replies, error: repliesError },
    { data: prompts, error: promptsError },
    { data: summaries, error: summariesError },
  ] = await Promise.all([
    supabase
      .from("replies")
      .select(`*, author:profiles!replies_author_id_fkey(${profileSelect})`)
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("generated_prompts")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("thread_summaries")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (repliesError) throw new Error(repliesError.message);
  if (promptsError) throw new Error(promptsError.message);
  if (summariesError) throw new Error(summariesError.message);

  return {
    ...normalizeThread(threadRow),
    replies: (replies ?? []) as Reply[],
    generated_prompts: (prompts ?? []) as GeneratedPrompt[],
    thread_summaries: (summaries ?? []) as ThreadSummary[],
  } satisfies ThreadDetail;
}

export async function getProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      creator:profiles!projects_created_by_fkey(${profileSelect}),
      project_members(count),
      threads(count)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeProject);
}

export async function getProjectById(supabase: SupabaseClient, id: string) {
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      *,
      creator:profiles!projects_created_by_fkey(${profileSelect}),
      project_members(count),
      threads(count)
    `,
    )
    .eq("id", id)
    .single();

  if (projectError) throw new Error(projectError.message);

  const [
    { data: members, error: membersError },
    { data: threads, error: threadsError },
  ] = await Promise.all([
    supabase
      .from("project_members")
      .select(`*, profile:profiles!project_members_user_id_fkey(${profileSelect})`)
      .eq("project_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("threads")
      .select(
        `
        *,
        author:profiles!threads_author_id_fkey(${profileSelect}),
        replies(count)
      `,
      )
      .eq("project_id", id)
      .order("updated_at", { ascending: false }),
  ]);

  if (membersError) throw new Error(membersError.message);
  if (threadsError) throw new Error(threadsError.message);

  return {
    ...normalizeProject(projectRow),
    members: (members ?? []) as ProjectMember[],
    threads: (threads ?? []).map(normalizeThread),
  } satisfies ProjectDetail;
}

export async function getProfiles(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function getMentionTargets(
  supabase: SupabaseClient,
): Promise<MentionTarget[]> {
  const [profiles, projects, threads] = await Promise.all([
    getProfiles(supabase),
    getProjects(supabase),
    getThreads(supabase, { sort: "newest" }),
  ]);

  return [
    ...profiles.map((profile) => ({
      kind: "person" as const,
      id: profile.id,
      label: profileLabel(profile),
      detail: profileDetail(profile),
    })),
    ...projects.map((project) => ({
      kind: "project" as const,
      id: project.id,
      label: project.name,
      detail: project.description,
    })),
    ...threads.map((thread) => ({
      kind: "thread" as const,
      id: thread.id,
      label: thread.title,
      detail: `${threadTypeLabel(thread.type)} · ${thread.project?.name ?? "No project"}`,
    })),
  ];
}

export async function getChatMessages(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(`*, author:profiles!chat_messages_author_id_fkey(${profileSelect})`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function getPersonById(
  supabase: SupabaseClient,
  id: string,
): Promise<PersonDetail> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileError) throw new Error(profileError.message);

  const [
    { data: threads, error: threadsError },
    { data: projectMemberships, error: projectsError },
  ] = await Promise.all([
    supabase
      .from("threads")
      .select(
        `
        *,
        author:profiles!threads_author_id_fkey(${profileSelect}),
        project:projects!threads_project_id_fkey(*),
        replies(count)
      `,
      )
      .eq("author_id", id)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("project_members")
      .select(
        `
        project:projects!project_members_project_id_fkey(
          *,
          creator:profiles!projects_created_by_fkey(${profileSelect}),
          project_members(count),
          threads(count)
        )
      `,
      )
      .eq("user_id", id)
      .limit(12),
  ]);

  if (threadsError) throw new Error(threadsError.message);
  if (projectsError) throw new Error(projectsError.message);

  return {
    profile: profile as Profile,
    threads: (threads ?? []).map(normalizeThread),
    projects: (projectMemberships ?? [])
      .map((membership) =>
        Array.isArray(membership.project) ? membership.project[0] : membership.project,
      )
      .filter(Boolean)
      .map((project) => normalizeProject(project as unknown as ProjectRow)),
  };
}

export async function getWeeklyDigests(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("weekly_digests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw new Error(error.message);
  return (data ?? []) as WeeklyDigest[];
}

export async function getDashboardData(supabase: SupabaseClient) {
  const [
    recentThreads,
    openRequests,
    projects,
    { count: threadCount, error: threadCountError },
    { count: openRequestCount, error: openRequestCountError },
    { count: projectCount, error: projectCountError },
  ] = await Promise.all([
    getThreads(supabase, { sort: "newest" }),
    getThreads(supabase, { status: "open", sort: "newest" }),
    getProjects(supabase),
    supabase.from("threads").select("id", { count: "exact", head: true }),
    supabase
      .from("threads")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase.from("projects").select("id", { count: "exact", head: true }),
  ]);

  if (threadCountError) throw new Error(threadCountError.message);
  if (openRequestCountError) throw new Error(openRequestCountError.message);
  if (projectCountError) throw new Error(projectCountError.message);

  return {
    stats: {
      recentThreads: threadCount ?? recentThreads.length,
      openRequests: openRequestCount ?? openRequests.length,
      activeProjects: projectCount ?? projects.length,
    },
    recentThreads: recentThreads.slice(0, 6),
    openRequests: openRequests
      .sort((a, b) => {
        if (a.type === "help_request" && b.type !== "help_request") return -1;
        if (a.type !== "help_request" && b.type === "help_request") return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, 4),
    recentProjectUpdates: recentThreads
      .filter((thread) => thread.type === "project_update")
      .slice(0, 4),
    projects,
  };
}

export async function getWeeklyDigestContext(supabase: SupabaseClient) {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [
    { data: threads, error: threadsError },
    { data: projects, error: projectsError },
  ] = await Promise.all([
      supabase
        .from("threads")
        .select(
          `
          *,
          author:profiles!threads_author_id_fkey(${profileSelect}),
          project:projects!threads_project_id_fkey(*),
          replies(
            id,
            thread_id,
            author_id,
            body,
            created_at,
            author:profiles!replies_author_id_fkey(${profileSelect})
          )
        `,
        )
        .gte("updated_at", since.toISOString())
        .order("updated_at", { ascending: false })
        .limit(50),
      supabase
        .from("projects")
        .select("*, project_members(count), threads(count)")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  if (threadsError) throw new Error(threadsError.message);
  if (projectsError) throw new Error(projectsError.message);

  return {
    threads: (threads ?? []).map((thread) => ({
      ...normalizeThread(thread),
      replies: repliesSince(thread.replies, since) as Reply[],
    })),
    projects: (projects ?? []).map(normalizeProject),
  };
}
