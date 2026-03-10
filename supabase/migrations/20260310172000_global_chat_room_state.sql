create table if not exists public.global_chat_room_state (
  room_slug text primary key references public.global_chat_rooms(slug) on delete cascade,
  slow_mode_seconds int not null default 0,
  closed_until timestamptz
);

alter table public.global_chat_room_state enable row level security;

drop policy if exists global_chat_room_state_read on public.global_chat_room_state;
create policy global_chat_room_state_read
  on public.global_chat_room_state
  for select
  using (true);

create index if not exists idx_global_chat_room_state_closed_until
  on public.global_chat_room_state (closed_until);
