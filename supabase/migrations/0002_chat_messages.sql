create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null constraint chat_messages_author_id_fkey references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_author_id_idx on public.chat_messages (author_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Chat messages are readable by authenticated users"
on public.chat_messages;
create policy "Chat messages are readable by authenticated users"
on public.chat_messages for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create chat messages"
on public.chat_messages;
create policy "Authenticated users can create chat messages"
on public.chat_messages for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "Authors can update their own chat messages"
on public.chat_messages;
create policy "Authors can update their own chat messages"
on public.chat_messages for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "Authors can delete their own chat messages"
on public.chat_messages;
create policy "Authors can delete their own chat messages"
on public.chat_messages for delete
to authenticated
using (author_id = auth.uid());
