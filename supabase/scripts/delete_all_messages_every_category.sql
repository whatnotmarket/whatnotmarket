-- One-shot SQL script:
-- Delete ALL chat messages from every category/room and private chats.
-- Warning: this is destructive and permanent.

begin;

-- Global chat categories/rooms (includes threaded replies).
delete from public.global_chat_messages g
using public.global_chat_rooms r
where g.room = r.slug;

-- Safety fallback for any legacy/unlinked rows.
delete from public.global_chat_messages;

-- Marketplace direct/deal chat.
delete from public.messages;

-- Realtime room-based chat.
delete from public.chat_messages;

commit;
