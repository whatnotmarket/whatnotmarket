# Prompt Completo — Moderazione Global Chat (SQL + Realtime + RLS + Design UI)

## Obiettivo
Attivare moderazione della Global Chat in un progetto collegato, con:
- Schema DB, RLS, Realtime e funzioni di moderazione
- Linee guida di design e UI, adattate allo stile del progetto (dark theme, rounded, minimal)
- Setup ambienti e endpoint per collegamento automatico

---

## 1) Script SQL Unico (da incollare nel Supabase SQL editor)

Copialo e incollalo interamente:

```
create extension if not exists "uuid-ossp";

create table if not exists public.global_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  room text not null,
  message text not null,
  created_at timestamptz not null default now(),
  reply_to_id uuid null,
  mentioned_handles text[] not null default '{}'::text[],
  is_deleted boolean not null default false
);

alter table public.global_chat_messages enable row level security;

drop policy if exists global_chat_messages_read_not_deleted on public.global_chat_messages;
create policy global_chat_messages_read_not_deleted
  on public.global_chat_messages
  for select
  to anon, authenticated
  using (is_deleted = false);

create index if not exists idx_global_chat_messages_room_created
  on public.global_chat_messages (room, created_at desc);
create index if not exists idx_global_chat_messages_user_created
  on public.global_chat_messages (user_id, created_at desc);
create index if not exists idx_global_chat_messages_deleted_room_created
  on public.global_chat_messages (is_deleted, room, created_at desc);

create table if not exists public.global_chat_user_controls (
  user_id uuid primary key,
  is_muted boolean not null default false,
  muted_until timestamptz null,
  is_banned boolean not null default false,
  banned_until timestamptz null,
  is_moderator boolean not null default false,
  moderator_override boolean not null default false
);

alter table public.global_chat_user_controls enable row level security;

drop policy if exists global_chat_user_controls_select_owner on public.global_chat_user_controls;
create policy global_chat_user_controls_select_owner
  on public.global_chat_user_controls
  for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists idx_global_chat_user_controls_banned_until
  on public.global_chat_user_controls (banned_until);
create index if not exists idx_global_chat_user_controls_muted_until
  on public.global_chat_user_controls (muted_until);

create table if not exists public.global_chat_room_state (
  room_slug text primary key,
  slow_mode_seconds int not null default 0,
  closed_until timestamptz null
);

alter table public.global_chat_room_state enable row level security;

drop policy if exists global_chat_room_state_read on public.global_chat_room_state;
create policy global_chat_room_state_read
  on public.global_chat_room_state
  for select
  to anon, authenticated
  using (true);

create index if not exists idx_global_chat_room_state_closed_until
  on public.global_chat_room_state (closed_until);

create table if not exists public.global_chat_moderation_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid null,
  room text null,
  message text null,
  code text not null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'global_chat_messages'
  ) then
    alter publication supabase_realtime add table public.global_chat_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'global_chat_user_controls'
  ) then
    alter publication supabase_realtime add table public.global_chat_user_controls;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'global_chat_room_state'
  ) then
    alter publication supabase_realtime add table public.global_chat_room_state;
  end if;
end $$;

create or replace function public.admin_delete_message(p_message_id uuid, p_reason text default 'Removed by admin')
returns void language plpgsql security definer set search_path = public as $$
declare r record; begin
  select id, user_id, room, message into r from public.global_chat_messages where id = p_message_id;
  update public.global_chat_messages set is_deleted = true where id = p_message_id;
  insert into public.global_chat_moderation_logs(user_id, room, message, code, reason, metadata)
  values (r.user_id, r.room, r.message, 'ADMIN_DELETE_MESSAGE', coalesce(p_reason, 'Removed by admin'), jsonb_build_object('message_id', p_message_id));
end; $$;

create or replace function public.admin_ban_message(p_message_id uuid, p_reason text default 'Banned by admin')
returns void language plpgsql security definer set search_path = public as $$
declare r record; begin
  select id, user_id, room, message into r from public.global_chat_messages where id = p_message_id;
  update public.global_chat_messages set is_deleted = true where id = p_message_id;
  insert into public.global_chat_moderation_logs(user_id, room, message, code, reason, metadata)
  values (r.user_id, r.room, r.message, 'ADMIN_BAN_MESSAGE', coalesce(p_reason, 'Banned by admin'), jsonb_build_object('message_id', p_message_id));
end; $$;

create or replace function public.admin_mute_user(p_user_id uuid, p_minutes int default 60, p_reason text default 'Muted by admin')
returns void language plpgsql security definer set search_path = public as $$
declare v_until timestamptz; begin
  v_until := now() + make_interval(mins => greatest(1, p_minutes));
  insert into public.global_chat_user_controls (user_id, is_muted, muted_until)
  values (p_user_id, true, v_until)
  on conflict (user_id) do update
  set is_muted = excluded.is_muted, muted_until = excluded.muted_until;
  insert into public.global_chat_moderation_logs(user_id, code, reason, metadata)
  values (p_user_id, 'ADMIN_MUTE_USER', coalesce(p_reason, 'Muted by admin'), jsonb_build_object('muted_until', v_until));
end; $$;

create or replace function public.admin_ban_user(p_user_id uuid, p_reason text default 'Banned by admin')
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.global_chat_user_controls (user_id, is_banned, banned_until)
  values (p_user_id, true, null)
  on conflict (user_id) do update
  set is_banned = excluded.is_banned, banned_until = excluded.banned_until;
  update public.global_chat_messages set is_deleted = true where user_id = p_user_id;
  insert into public.global_chat_moderation_logs(user_id, code, reason, metadata)
  values (p_user_id, 'ADMIN_BAN_USER', coalesce(p_reason, 'Banned by admin'), jsonb_build_object('deleted_all_messages', true));
end; $$;

create or replace function public.admin_unban_all()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.global_chat_moderation_logs (user_id, code, reason, metadata)
  select u.user_id, 'ADMIN_UNBAN_USER', 'Bulk unban', jsonb_build_object('bulk', true)
  from public.global_chat_user_controls u
  where coalesce(u.is_banned, false) = true or u.banned_until is not null;
  update public.global_chat_user_controls set is_banned = false, banned_until = null;
end; $$;

revoke all on function public.admin_delete_message(uuid, text) from public;
revoke all on function public.admin_ban_message(uuid, text) from public;
revoke all on function public.admin_mute_user(uuid, int, text) from public;
revoke all on function public.admin_ban_user(uuid, text) from public;
revoke all on function public.admin_unban_all() from public;

grant execute on function public.admin_delete_message(uuid, text) to service_role;
grant execute on function public.admin_ban_message(uuid, text) to service_role;
grant execute on function public.admin_mute_user(uuid, int, text) to service_role;
grant execute on function public.admin_ban_user(uuid, text) to service_role;
grant execute on function public.admin_unban_all() to service_role;
```

---

## 2) Variabili d’ambiente richieste
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (solo lato server)

---

## 3) Endpoint da abilitare (service role)
- POST `/api/admin/dashboard/public-chat` (delete/ban/mute/unmute/unban + audit)
- POST `/api/moderation/public-chat/room-state` (slow_mode/close/open; chiusura permanente se minutes<=0)

---

## 4) Design & UI — Adattamento allo stile esistente

### Global Chat (utente)
- Tema: dark; font-sans; rounded-2xl; border-white/20; bg `#0A0A0A`/`#101010`; testo `text-white`/`text-zinc-300`.
- Banner inline (trasparenti, minimal):
  - Banned: testo rosso `text-[#ff0000]` + “You are banned to write here”
  - Muted: icona fornita + “You are muted to write here”
  - Slow-mode: icona 16x16 + `font-semibold` “Slow mode attivo” + tempo `(Xs)` in `text-zinc-400`
  - Closed permanente: solo testo `font-semibold` “This chat is closed” (senza icona)
- Input:
  - Disabilitato quando banned/muted/slowed/closed
  - Placeholder dinamico:
    - Banned: “You are banned from global chat.”
    - Muted: “You are muted for X seconds.”
    - Closed: “This chat is closed”
    - Slow-mode: “Slow mode active”

### Dashboard Moderatore (Admin/Public Chat)
- Top controls:
  - Selettore room (lingua), search “Search messages or users”
  - Indicatore `Room`: `OPEN`/`CLOSED` con `text-green-400`/`text-red-400`
  - Indicatore `Slow`: “OFF”/“Ns” (`text-zinc-300`)
  - Quick buttons: OFF, 10s, 30s, 60s (bg `bg-zinc-800`), `Close room` (bg `bg-red-600`), `Open room` (bg `bg-green-600`), `Reload`
- Stream messaggi (colonna sinistra):
  - Card `rounded-2xl border-2 border-white/10 bg-[#101010] px-3 py-3 text-sm text-zinc-300`
  - Deleted: `text-zinc-500 line-through` + label “Message removed”
  - Azioni visibili: `Delete` (neutro), `Ban` (rosso)
  - Menu “User ▾”: `Mute 5m/30m/1h`, `Ban`, `Unmute`, `Unban`, `View history`
- Active users (colonna destra):
  - Lista con badge `online/muted/banned` (`bg-zinc-700`/`bg-orange-600`/`bg-red-600`)
  - Details: cartella con username, count, last message, azioni rapide, storico

---

## 5) Realtime & Enforcement (riassunto)
- Realtime publication attiva per: messages, user_controls, room_state
- Enforcement lato server:
  - BAN/MUTE → rifiuto post + log
  - SLOW_MODE → rifiuto con tempo residuo
  - ROOM_CLOSED → rifiuto durante chiusura
  - Ruoli stanza: seller/buyer conforme
  - Flood limit e duplicate check

---

## 6) Verifica finale
- SQL eseguito senza errori
- Publication realtime: tabelle presenti in `supabase_realtime`
- Policy RLS attive
- Env impostate
- Endpoint abilitati con service role

