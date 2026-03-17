-- Admin invite management + runtime configuration tables.

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'set_updated_at' and n.nspname = 'public'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

create table if not exists public.invite_codes (
  code text primary key,
  type text not null check (type in ('buyer', 'seller', 'founder')),
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired', 'exhausted')),
  single_use boolean not null default false,
  usage_limit integer,
  usage_count integer not null default 0,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  last_used_by uuid references public.profiles(id) on delete set null,
  last_used_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invite_codes_usage_limit_positive check (usage_limit is null or usage_limit > 0),
  constraint invite_codes_usage_count_non_negative check (usage_count >= 0)
);

create index if not exists invite_codes_status_idx
  on public.invite_codes (status, type, created_at desc);

create index if not exists invite_codes_expires_idx
  on public.invite_codes (expires_at);

create table if not exists public.invite_code_usages (
  id uuid primary key default uuid_generate_v4(),
  code text not null references public.invite_codes(code) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  ip_address text,
  user_agent text,
  source text,
  used_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists invite_code_usages_code_idx
  on public.invite_code_usages (code, used_at desc);

create index if not exists invite_code_usages_user_idx
  on public.invite_code_usages (user_id, used_at desc);

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invite_codes enable row level security;
alter table public.invite_code_usages enable row level security;
alter table public.admin_settings enable row level security;

drop policy if exists invite_codes_admin_select on public.invite_codes;
create policy invite_codes_admin_select
  on public.invite_codes
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists invite_codes_admin_insert on public.invite_codes;
create policy invite_codes_admin_insert
  on public.invite_codes
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists invite_codes_admin_update on public.invite_codes;
create policy invite_codes_admin_update
  on public.invite_codes
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists invite_codes_admin_delete on public.invite_codes;
create policy invite_codes_admin_delete
  on public.invite_codes
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists invite_code_usages_admin_read on public.invite_code_usages;
create policy invite_code_usages_admin_read
  on public.invite_code_usages
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists admin_settings_admin_read on public.admin_settings;
create policy admin_settings_admin_read
  on public.admin_settings
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists admin_settings_admin_insert on public.admin_settings;
create policy admin_settings_admin_insert
  on public.admin_settings
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists admin_settings_admin_update on public.admin_settings;
create policy admin_settings_admin_update
  on public.admin_settings
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop trigger if exists set_invite_codes_updated_at on public.invite_codes;
create trigger set_invite_codes_updated_at
before update on public.invite_codes
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_settings_updated_at on public.admin_settings;
create trigger set_admin_settings_updated_at
before update on public.admin_settings
for each row execute function public.set_updated_at();
