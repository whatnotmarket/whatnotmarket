-- Admin control fields for account state and forced session reset.

alter table public.profiles
  add column if not exists account_status text not null default 'active';

alter table public.profiles
  add column if not exists account_note text;

alter table public.profiles
  add column if not exists session_force_logout_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_status_check
      check (account_status in ('active', 'suspended', 'banned'));
  end if;
end $$;

create index if not exists profiles_account_status_idx
  on public.profiles (account_status);

create index if not exists profiles_session_force_logout_idx
  on public.profiles (session_force_logout_at);
