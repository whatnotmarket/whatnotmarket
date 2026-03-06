-- Profile social metrics and bio support.

alter table public.profiles
  add column if not exists bio text;

create table if not exists public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint profile_follows_no_self check (follower_id <> following_id)
);

create index if not exists profile_follows_following_idx on public.profile_follows (following_id);

alter table public.profile_follows enable row level security;

drop policy if exists profile_follows_select_public on public.profile_follows;
create policy profile_follows_select_public
  on public.profile_follows for select
  using (true);

drop policy if exists profile_follows_insert_self on public.profile_follows;
create policy profile_follows_insert_self
  on public.profile_follows for insert
  with check (auth.uid() = follower_id and auth.uid() <> following_id);

drop policy if exists profile_follows_delete_self on public.profile_follows;
create policy profile_follows_delete_self
  on public.profile_follows for delete
  using (auth.uid() = follower_id);
