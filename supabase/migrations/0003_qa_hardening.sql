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
