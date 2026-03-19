create table if not exists public.maintenance_early_access_leads (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  email_normalized text not null,
  source text not null default 'maintenance_page',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  last_error text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_early_access_status_check
    check (status in ('pending', 'confirmed', 'email_failed')),
  constraint maintenance_early_access_email_not_empty
    check (length(trim(email)) > 3),
  constraint maintenance_early_access_email_normalized_check
    check (email_normalized = lower(trim(email)))
);

create unique index if not exists maintenance_early_access_email_norm_uidx
  on public.maintenance_early_access_leads (email_normalized);

create index if not exists maintenance_early_access_created_at_idx
  on public.maintenance_early_access_leads (created_at desc);

alter table if exists public.maintenance_early_access_leads enable row level security;

revoke all on table public.maintenance_early_access_leads from anon;
revoke all on table public.maintenance_early_access_leads from authenticated;

drop policy if exists maintenance_early_access_no_client_access on public.maintenance_early_access_leads;
create policy maintenance_early_access_no_client_access
  on public.maintenance_early_access_leads
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);
