-- Disable legacy profile_follows surface to prevent abuse and shadow follow graphs.
-- Canonical follow relation is public.follows.

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profile_follows'
  ) then
    -- Stop side-effect notifications from legacy table.
    drop trigger if exists trg_notify_profile_follow_created on public.profile_follows;

    -- Remove permissive legacy policies.
    drop policy if exists profile_follows_select_public on public.profile_follows;
    drop policy if exists profile_follows_insert_self on public.profile_follows;
    drop policy if exists profile_follows_delete_self on public.profile_follows;
    drop policy if exists profile_follows_no_access on public.profile_follows;

    -- Explicit deny-all policy for anon/authenticated contexts.
    create policy profile_follows_no_access
      on public.profile_follows
      for all
      using (false)
      with check (false);

    -- Defense in depth at privilege layer.
    revoke all on table public.profile_follows from anon, authenticated;
  end if;
end $$;
