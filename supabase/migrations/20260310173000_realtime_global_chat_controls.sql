-- Ensure realtime for moderation-related tables
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'global_chat_user_controls'
  ) then
    alter publication supabase_realtime add table public.global_chat_user_controls;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'global_chat_room_state'
  ) then
    alter publication supabase_realtime add table public.global_chat_room_state;
  end if;
end $$;
