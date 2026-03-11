create table if not exists public.global_chat_rooms (
  slug text primary key,
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.global_chat_rooms (slug, label, description, is_active)
values
  ('global', 'Global', 'Open chat for everyone.', true),
  ('buy-services', 'Buy Services', 'Requests for buying services.', true),
  ('sell-services', 'Sell Services', 'Offers for selling services.', true),
  ('crypto-talk', 'Crypto Talk', 'Crypto and market discussions.', true),
  ('help', 'Help', 'Support and troubleshooting.', true),
  ('english', 'English', 'General English room.', true)
on conflict (slug) do update
set label = excluded.label,
    description = excluded.description,
    is_active = excluded.is_active;

alter table public.global_chat_messages
  add column if not exists room text;

update public.global_chat_messages
set room = 'global'
where room is null;

alter table public.global_chat_messages
  alter column room set default 'global';

alter table public.global_chat_messages
  alter column room set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'global_chat_messages_room_fkey'
  ) then
    alter table public.global_chat_messages
      add constraint global_chat_messages_room_fkey
      foreign key (room) references public.global_chat_rooms(slug) on delete restrict;
  end if;
end $$;

alter table public.global_chat_messages
  drop constraint if exists global_chat_messages_message_check;

alter table public.global_chat_messages
  add constraint global_chat_messages_message_check
  check (
    char_length(trim(message)) between 1 and 180
    and message !~* 'https?://(?!(?:[^/]*\\.)?swaprmarket\\.market|(?:www\\.)?swaprmarket\\.com|localhost(?::\\d{1,5})?|127\\.0\\.0\\.1(?::\\d{1,5})?)[^\\s]+'
    and message !~* '\\b(?!(?:[^\\s]*\\.)?swaprmarket\\.market|(?:www\\.)?swaprmarket\\.com|localhost|127\\.0\\.0\\.1)[a-z0-9.-]+\\.(?:com|net|org|io|ru|xyz|gg|me|app|co|dev|market)\\b'
  );

alter table public.global_chat_messages
  add column if not exists message_normalized text;

update public.global_chat_messages
set message_normalized = lower(regexp_replace(trim(message), '\s+', ' ', 'g'))
where message_normalized is null or message_normalized = '';

alter table public.global_chat_messages
  alter column message_normalized set not null;

create index if not exists idx_global_chat_messages_room_created_at
  on public.global_chat_messages (room, created_at desc);

create index if not exists idx_global_chat_messages_user_room_created_at
  on public.global_chat_messages (user_id, room, created_at desc);

create index if not exists idx_global_chat_messages_user_message_norm_created_at
  on public.global_chat_messages (user_id, message_normalized, created_at desc);

revoke insert on table public.global_chat_messages from authenticated, anon;
drop policy if exists "Authenticated users can insert global chat messages" on public.global_chat_messages;

create table if not exists public.global_chat_blocked_phrases (
  phrase text primary key,
  reason text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.global_chat_blocked_phrases (phrase, reason, is_active)
values
  ('dm me', 'Marketplace off-platform spam', true),
  ('quick profit', 'Scam pattern', true),
  ('guaranteed profit', 'Scam pattern', true),
  ('send first', 'Unsafe trading pattern', true),
  ('no escrow', 'Unsafe trading pattern', true),
  ('instant稳赚', 'Spam pattern', true)
on conflict (phrase) do update
set reason = excluded.reason,
    is_active = excluded.is_active;

create table if not exists public.global_chat_user_controls (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_muted boolean not null default false,
  muted_until timestamptz,
  is_banned boolean not null default false,
  banned_until timestamptz,
  is_moderator boolean not null default false,
  moderator_override boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_chat_moderation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  room text,
  message text,
  code text not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_global_chat_moderation_logs_user_created_at
  on public.global_chat_moderation_logs (user_id, created_at desc);

alter table public.global_chat_rooms enable row level security;
alter table public.global_chat_blocked_phrases enable row level security;
alter table public.global_chat_user_controls enable row level security;
alter table public.global_chat_moderation_logs enable row level security;

grant select on table public.global_chat_rooms to anon, authenticated;

drop policy if exists "Global chat rooms are publicly readable" on public.global_chat_rooms;
create policy "Global chat rooms are publicly readable"
  on public.global_chat_rooms
  for select
  using (true);
