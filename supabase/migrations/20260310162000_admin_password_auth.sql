create extension if not exists pgcrypto;

create table if not exists public.admin_password (
  id smallint primary key default 1,
  secret_hash text not null,
  updated_at timestamptz not null default now(),
  constraint admin_password_singleton check (id = 1)
);

alter table public.admin_password enable row level security;

drop policy if exists admin_password_no_access on public.admin_password;
create policy admin_password_no_access on public.admin_password
  as restrictive
  for all
  using (false)
  with check (false);

create or replace function public.verify_admin_password(p_password text)
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select extensions.crypt(p_password, secret_hash) = secret_hash
  from public.admin_password
  where id = 1
$$;

create or replace function public.set_admin_password(p_password text)
returns void
language sql
security definer
volatile
set search_path = public, extensions
as $$
  update public.admin_password
  set secret_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = 1;
  insert into public.admin_password (id, secret_hash)
  select 1, extensions.crypt(p_password, extensions.gen_salt('bf', 10))
  where not exists (select 1 from public.admin_password where id = 1);
$$;

revoke all on function public.verify_admin_password(text) from public;
grant execute on function public.verify_admin_password(text) to anon, authenticated;

revoke all on function public.set_admin_password(text) from public;
grant execute on function public.set_admin_password(text) to service_role;

insert into public.admin_password (id, secret_hash)
values (1, extensions.crypt('CHANGE_ME_ADMIN_PASSWORD', extensions.gen_salt('bf', 10)))
on conflict (id) do nothing;
