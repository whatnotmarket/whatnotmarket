-- Soft delete for global chat messages
alter table public.global_chat_messages
  add column if not exists is_deleted boolean not null default false;

create index if not exists idx_global_chat_messages_deleted_room_created
  on public.global_chat_messages (is_deleted, room, created_at desc);
