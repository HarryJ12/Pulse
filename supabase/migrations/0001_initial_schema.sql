create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  github_username text,
  github_url text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  repo_url text,
  live_url text,
  loom_url text,
  created_by uuid not null constraint projects_created_by_fkey references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null constraint project_members_project_id_fkey references public.projects(id) on delete cascade,
  user_id uuid not null constraint project_members_user_id_fkey references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null check (type in ('help_request', 'project_update', 'feedback_request', 'looking_for_collaborator', 'resource_share')),
  status text not null default 'open' check (status in ('open', 'resolved', 'archived')),
  tags text[] not null default '{}',
  project_id uuid constraint threads_project_id_fkey references public.projects(id) on delete set null,
  author_id uuid not null constraint threads_author_id_fkey references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null constraint replies_thread_id_fkey references public.threads(id) on delete cascade,
  author_id uuid not null constraint replies_author_id_fkey references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_prompts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null constraint generated_prompts_thread_id_fkey references public.threads(id) on delete cascade,
  created_by uuid not null constraint generated_prompts_created_by_fkey references public.profiles(id) on delete cascade,
  content text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.thread_summaries (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null constraint thread_summaries_thread_id_fkey references public.threads(id) on delete cascade,
  created_by uuid not null constraint thread_summaries_created_by_fkey references public.profiles(id) on delete cascade,
  content text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_digests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid not null constraint weekly_digests_created_by_fkey references public.profiles(id) on delete cascade,
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_github_username_idx on public.profiles (github_username);
create index if not exists projects_created_by_idx on public.projects (created_by);
create index if not exists project_members_project_id_idx on public.project_members (project_id);
create index if not exists project_members_user_id_idx on public.project_members (user_id);
create index if not exists threads_author_id_idx on public.threads (author_id);
create index if not exists threads_project_id_idx on public.threads (project_id);
create index if not exists threads_type_idx on public.threads (type);
create index if not exists threads_status_idx on public.threads (status);
create index if not exists threads_created_at_idx on public.threads (created_at desc);
create index if not exists threads_tags_idx on public.threads using gin (tags);
create index if not exists replies_thread_id_idx on public.replies (thread_id);
create index if not exists generated_prompts_thread_id_idx on public.generated_prompts (thread_id);
create index if not exists thread_summaries_thread_id_idx on public.thread_summaries (thread_id);
create index if not exists weekly_digests_created_at_idx on public.weekly_digests (created_at desc);

create or replace function public.set_thread_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_thread_updated_at on public.threads;
create trigger set_thread_updated_at
before update on public.threads
for each row execute function public.set_thread_updated_at();

create or replace function public.touch_thread_from_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.threads
  set updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists touch_thread_from_reply on public.replies;
create trigger touch_thread_from_reply
after insert on public.replies
for each row execute function public.touch_thread_from_reply();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  username text;
begin
  username := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'user_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'preferred_username'), ''),
    nullif(btrim(new.raw_user_meta_data->>'login'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), '')
  );

  insert into public.profiles (
    id,
    name,
    email,
    github_username,
    github_url,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data->>'name'), ''),
      username,
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pulse member'
    ),
    nullif(btrim(new.email), ''),
    username,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'html_url'), ''),
      nullif(btrim(new.raw_user_meta_data->>'github_url'), ''),
      case when username is not null then 'https://github.com/' || username else null end
    ),
    nullif(btrim(new.raw_user_meta_data->>'avatar_url'), '')
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    github_username = excluded.github_username,
    github_url = excluded.github_url,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.threads enable row level security;
alter table public.replies enable row level security;
alter table public.generated_prompts enable row level security;
alter table public.thread_summaries enable row level security;
alter table public.weekly_digests enable row level security;

drop policy if exists "Profiles are readable by authenticated users"
on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile"
on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profile"
on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Projects are readable by authenticated users"
on public.projects;
create policy "Projects are readable by authenticated users"
on public.projects for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create projects"
on public.projects;
create policy "Authenticated users can create projects"
on public.projects for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Project creators can update projects"
on public.projects;
create policy "Project creators can update projects"
on public.projects for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Project creators can delete projects"
on public.projects;
create policy "Project creators can delete projects"
on public.projects for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Project members are readable by authenticated users"
on public.project_members;
create policy "Project members are readable by authenticated users"
on public.project_members for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create project memberships"
on public.project_members;
drop policy if exists "Project creators and users can create project memberships"
on public.project_members;
create policy "Project creators and users can create project memberships"
on public.project_members for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.created_by = auth.uid()
  )
);

drop policy if exists "Project creators or members can remove memberships"
on public.project_members;
create policy "Project creators or members can remove memberships"
on public.project_members for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.created_by = auth.uid()
  )
);

drop policy if exists "Threads are readable by authenticated users"
on public.threads;
create policy "Threads are readable by authenticated users"
on public.threads for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create threads"
on public.threads;
create policy "Authenticated users can create threads"
on public.threads for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "Authors can update their own threads"
on public.threads;
create policy "Authors can update their own threads"
on public.threads for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "Authors can delete their own threads"
on public.threads;
create policy "Authors can delete their own threads"
on public.threads for delete
to authenticated
using (author_id = auth.uid());

drop policy if exists "Replies are readable by authenticated users"
on public.replies;
create policy "Replies are readable by authenticated users"
on public.replies for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create replies"
on public.replies;
create policy "Authenticated users can create replies"
on public.replies for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "Authors can update their own replies"
on public.replies;
create policy "Authors can update their own replies"
on public.replies for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "Authors can delete their own replies"
on public.replies;
create policy "Authors can delete their own replies"
on public.replies for delete
to authenticated
using (author_id = auth.uid());

drop policy if exists "Generated prompts are readable by authenticated users"
on public.generated_prompts;
create policy "Generated prompts are readable by authenticated users"
on public.generated_prompts for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create prompts"
on public.generated_prompts;
create policy "Authenticated users can create prompts"
on public.generated_prompts for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Prompt creators can delete prompts"
on public.generated_prompts;
create policy "Prompt creators can delete prompts"
on public.generated_prompts for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Thread summaries are readable by authenticated users"
on public.thread_summaries;
create policy "Thread summaries are readable by authenticated users"
on public.thread_summaries for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create summaries"
on public.thread_summaries;
create policy "Authenticated users can create summaries"
on public.thread_summaries for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Summary creators can delete summaries"
on public.thread_summaries;
create policy "Summary creators can delete summaries"
on public.thread_summaries for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Weekly digests are readable by authenticated users"
on public.weekly_digests;
create policy "Weekly digests are readable by authenticated users"
on public.weekly_digests for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create weekly digests"
on public.weekly_digests;
create policy "Authenticated users can create weekly digests"
on public.weekly_digests for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Digest creators can delete weekly digests"
on public.weekly_digests;
create policy "Digest creators can delete weekly digests"
on public.weekly_digests for delete
to authenticated
using (created_by = auth.uid());
