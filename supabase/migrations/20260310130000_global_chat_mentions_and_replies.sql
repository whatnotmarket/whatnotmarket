alter table public.global_chat_messages
  add column if not exists reply_to_id uuid references public.global_chat_messages(id) on delete set null;

alter table public.global_chat_messages
  add column if not exists mentioned_handles text[] not null default '{}';

create index if not exists idx_global_chat_messages_reply_to_id
  on public.global_chat_messages (reply_to_id);

create index if not exists idx_global_chat_messages_mentioned_handles
  on public.global_chat_messages using gin (mentioned_handles);
