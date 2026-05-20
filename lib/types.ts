export const THREAD_TYPES = [
  { value: "help_request", label: "Help Request" },
  { value: "project_update", label: "Project Update" },
  { value: "feedback_request", label: "Feedback Request" },
  { value: "looking_for_collaborator", label: "Looking for Collaborator" },
  { value: "resource_share", label: "Resource Share" },
] as const;

export const THREAD_STATUSES = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
] as const;

export type ThreadType = (typeof THREAD_TYPES)[number]["value"];
export type ThreadStatus = (typeof THREAD_STATUSES)[number]["value"];

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  github_username: string | null;
  github_url: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  repo_url: string | null;
  live_url: string | null;
  loom_url: string | null;
  created_by: string;
  created_at: string;
  creator?: Profile | null;
  member_count?: number;
  thread_count?: number;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile | null;
};

export type Thread = {
  id: string;
  title: string;
  body: string;
  type: ThreadType;
  status: ThreadStatus;
  tags: string[];
  project_id: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
  project?: Project | null;
  reply_count?: number;
};

export type Reply = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile | null;
};

export type GeneratedPrompt = {
  id: string;
  thread_id: string;
  created_by: string;
  content: string;
  model: string;
  created_at: string;
};

export type ThreadSummary = {
  id: string;
  thread_id: string;
  created_by: string;
  content: string;
  model: string;
  created_at: string;
};

export type WeeklyDigest = {
  id: string;
  title: string;
  content: string;
  created_by: string;
  model: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile | null;
};

export type MentionKind = "person" | "project" | "thread";

export type MentionTarget = {
  kind: MentionKind;
  id: string;
  label: string;
  detail: string;
};

export type ThreadDetail = Thread & {
  replies: Reply[];
  generated_prompts: GeneratedPrompt[];
  thread_summaries: ThreadSummary[];
};

export type ProjectDetail = Project & {
  members: ProjectMember[];
  threads: Thread[];
};

export type PersonDetail = {
  profile: Profile;
  threads: Thread[];
  projects: Project[];
};

export function threadTypeLabel(type: string) {
  return THREAD_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function threadStatusLabel(status: string) {
  return THREAD_STATUSES.find((item) => item.value === status)?.label ?? status;
}
