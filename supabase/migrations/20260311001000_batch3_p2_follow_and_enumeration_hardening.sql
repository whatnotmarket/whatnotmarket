-- Batch 3 (P2): follow abuse hardening and anti-enumeration primitives.

-- 1) Remove any historical self-follow rows before enforcing the invariant.
delete from public.follows
where follower_id = following_id;

-- 2) Enforce "no self-follow" at DB level.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'follows_no_self_follow'
      and conrelid = 'public.follows'::regclass
  ) then
    alter table public.follows
      add constraint follows_no_self_follow
      check (follower_id <> following_id);
  end if;
end $$;

-- 3) Tighten follow insert policy so self-follow is blocked even before constraint evaluation.
drop policy if exists "Users can follow others" on public.follows;
drop policy if exists "Users can follow others." on public.follows;
create policy "Users can follow others"
  on public.follows
  for insert
  with check (
    auth.uid() = follower_id
    and follower_id <> following_id
  );

-- 4) Make follower count lookups deterministic and cheap for server-side anti-abuse checks.
create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx on public.follows (follower_id);
