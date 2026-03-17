-- Global shared chat table (public read, authenticated write)
create table if not exists public.global_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_global_chat_messages_created_at
  on public.global_chat_messages (created_at desc);

create index if not exists idx_global_chat_messages_user_id
  on public.global_chat_messages (user_id);

alter table public.global_chat_messages enable row level security;

grant select on public.global_chat_messages to anon, authenticated;
grant insert on public.global_chat_messages to authenticated;

drop policy if exists "Anyone can read global chat messages" on public.global_chat_messages;
create policy "Anyone can read global chat messages"
  on public.global_chat_messages
  for select
  using (true);

drop policy if exists "Authenticated users can insert global chat messages" on public.global_chat_messages;
create policy "Authenticated users can insert global chat messages"
  on public.global_chat_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'global_chat_messages'
  ) then
    alter publication supabase_realtime add table public.global_chat_messages;
  end if;
end $$;
