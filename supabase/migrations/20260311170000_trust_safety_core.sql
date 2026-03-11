-- Trust & Safety core schema for aggressive anti-scam enforcement.
-- Philosophy: assume bad intent until trust is built.

create extension if not exists "uuid-ossp";

alter table public.requests
  add column if not exists safety_status text not null default 'published',
  add column if not exists visibility_state text not null default 'normal',
  add column if not exists moderation_notes text,
  add column if not exists trust_reason_codes text[] not null default '{}'::text[],
  add column if not exists last_risk_score integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'requests_safety_status_check'
      and conrelid = 'public.requests'::regclass
  ) then
    alter table public.requests
      add constraint requests_safety_status_check
      check (safety_status in ('draft', 'pending_review', 'published', 'restricted', 'removed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'requests_visibility_state_check'
      and conrelid = 'public.requests'::regclass
  ) then
    alter table public.requests
      add constraint requests_visibility_state_check
      check (visibility_state in ('normal', 'limited', 'shadowed'));
  end if;
end $$;

create index if not exists requests_safety_status_idx
  on public.requests (safety_status);

create index if not exists requests_visibility_state_idx
  on public.requests (visibility_state);

create table if not exists public.trust_account_states (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  account_flag text not null default 'limited'
    check (account_flag in ('trusted', 'limited', 'under_review', 'suspended')),
  trust_score integer not null default 20 check (trust_score >= 0 and trust_score <= 100),
  risk_score integer not null default 0 check (risk_score >= 0),
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started', 'pending', 'verified', 'rejected')),
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  identity_verified boolean not null default false,
  restrictions jsonb not null default '{}'::jsonb,
  last_reason_codes text[] not null default '{}'::text[],
  trusted_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trust_device_signals (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  device_hash text not null,
  ip_hash text not null,
  user_agent_hash text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  login_count integer not null default 1,
  suspicious_count integer not null default 0,
  is_trusted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, device_hash, ip_hash)
);

create table if not exists public.trust_account_links (
  id bigserial primary key,
  source_user_id uuid not null references public.profiles(id) on delete cascade,
  linked_user_id uuid not null references public.profiles(id) on delete cascade,
  link_type text not null
    check (link_type in ('device_hash', 'ip_hash', 'wallet', 'behavioral')),
  confidence numeric(4,3) not null default 0.500 check (confidence >= 0 and confidence <= 1),
  reason_codes text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_risk_events (
  id bigserial primary key,
  entity_type text not null
    check (entity_type in ('user', 'listing', 'conversation', 'review', 'account')),
  entity_id text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  risk_score integer not null check (risk_score >= 0),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  reason_codes text[] not null default '{}'::text[],
  blocked boolean not null default false,
  action text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_risk_snapshots (
  entity_type text not null
    check (entity_type in ('user', 'listing', 'conversation', 'review', 'account')),
  entity_id text not null,
  risk_score integer not null check (risk_score >= 0),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  reason_codes text[] not null default '{}'::text[],
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists public.trust_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null
    check (target_type in ('user', 'listing', 'conversation', 'review')),
  target_id text not null,
  category text not null,
  description text,
  evidence_urls text[] not null default '{}'::text[],
  status text not null default 'open'
    check (status in ('open', 'in_review', 'resolved', 'dismissed')),
  priority integer not null default 1 check (priority between 1 and 5),
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  reason_codes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trust_moderation_cases (
  id uuid primary key default uuid_generate_v4(),
  source_report_id uuid references public.trust_reports(id) on delete set null,
  entity_type text not null
    check (entity_type in ('user', 'listing', 'conversation', 'review', 'account')),
  entity_id text not null,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'actioned', 'resolved', 'dismissed', 'appealed')),
  priority integer not null default 1 check (priority between 1 and 5),
  risk_score integer not null default 0 check (risk_score >= 0),
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  reason_codes text[] not null default '{}'::text[],
  summary text,
  notes text,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.trust_moderation_actions (
  id bigserial primary key,
  case_id uuid not null references public.trust_moderation_cases(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  target_type text,
  target_id text,
  reason_codes text[] not null default '{}'::text[],
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_security_events (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  ip_hash text,
  device_hash text,
  user_agent_hash text,
  location_hash text,
  is_suspicious boolean not null default false,
  reason_codes text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_review_integrity_events (
  id bigserial primary key,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewee_id uuid references public.profiles(id) on delete set null,
  reference_type text not null
    check (reference_type in ('deal', 'order', 'conversation')),
  reference_id text not null,
  risk_score integer not null default 0 check (risk_score >= 0),
  reason_codes text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_audit_logs (
  id bigserial primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id text,
  reason_codes text[] not null default '{}'::text[],
  ip_hash text,
  device_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trust_account_states_flag_idx
  on public.trust_account_states (account_flag);
create index if not exists trust_account_states_risk_idx
  on public.trust_account_states (risk_score desc, updated_at desc);

create index if not exists trust_device_signals_device_hash_idx
  on public.trust_device_signals (device_hash, last_seen_at desc);
create index if not exists trust_device_signals_ip_hash_idx
  on public.trust_device_signals (ip_hash, last_seen_at desc);

create index if not exists trust_account_links_source_idx
  on public.trust_account_links (source_user_id, created_at desc);
create index if not exists trust_account_links_linked_idx
  on public.trust_account_links (linked_user_id, created_at desc);

create index if not exists trust_risk_events_entity_idx
  on public.trust_risk_events (entity_type, entity_id, created_at desc);
create index if not exists trust_risk_events_actor_idx
  on public.trust_risk_events (actor_user_id, created_at desc);
create index if not exists trust_risk_events_level_idx
  on public.trust_risk_events (risk_level, created_at desc);

create index if not exists trust_reports_status_priority_idx
  on public.trust_reports (status, priority desc, created_at desc);
create index if not exists trust_reports_target_idx
  on public.trust_reports (target_type, target_id, created_at desc);

create index if not exists trust_moderation_cases_status_priority_idx
  on public.trust_moderation_cases (status, priority desc, created_at desc);
create index if not exists trust_moderation_cases_entity_idx
  on public.trust_moderation_cases (entity_type, entity_id, created_at desc);

create index if not exists trust_security_events_user_idx
  on public.trust_security_events (user_id, created_at desc);
create index if not exists trust_security_events_ip_idx
  on public.trust_security_events (ip_hash, created_at desc);
create index if not exists trust_security_events_device_idx
  on public.trust_security_events (device_hash, created_at desc);

create index if not exists trust_audit_logs_target_idx
  on public.trust_audit_logs (target_type, target_id, created_at desc);
create index if not exists trust_audit_logs_actor_idx
  on public.trust_audit_logs (actor_user_id, created_at desc);

drop trigger if exists set_trust_account_states_updated_at on public.trust_account_states;
create trigger set_trust_account_states_updated_at
before update on public.trust_account_states
for each row execute function public.set_updated_at();

drop trigger if exists set_trust_reports_updated_at on public.trust_reports;
create trigger set_trust_reports_updated_at
before update on public.trust_reports
for each row execute function public.set_updated_at();

drop trigger if exists set_trust_moderation_cases_updated_at on public.trust_moderation_cases;
create trigger set_trust_moderation_cases_updated_at
before update on public.trust_moderation_cases
for each row execute function public.set_updated_at();

create or replace function public.trust_immutable_table_guard()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Immutable trust log table';
end;
$$;

drop trigger if exists trust_audit_logs_immutable_guard on public.trust_audit_logs;
create trigger trust_audit_logs_immutable_guard
before update or delete on public.trust_audit_logs
for each row execute function public.trust_immutable_table_guard();

drop trigger if exists trust_risk_events_immutable_guard on public.trust_risk_events;
create trigger trust_risk_events_immutable_guard
before update or delete on public.trust_risk_events
for each row execute function public.trust_immutable_table_guard();

alter table public.trust_account_states enable row level security;
alter table public.trust_device_signals enable row level security;
alter table public.trust_account_links enable row level security;
alter table public.trust_risk_events enable row level security;
alter table public.trust_risk_snapshots enable row level security;
alter table public.trust_reports enable row level security;
alter table public.trust_moderation_cases enable row level security;
alter table public.trust_moderation_actions enable row level security;
alter table public.trust_security_events enable row level security;
alter table public.trust_review_integrity_events enable row level security;
alter table public.trust_audit_logs enable row level security;

drop policy if exists requests_select_public on public.requests;
create policy requests_select_public
  on public.requests for select
  using (
    coalesce(safety_status, 'published') = 'published'
    or created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_account_states_select_own_or_admin on public.trust_account_states;
create policy trust_account_states_select_own_or_admin
  on public.trust_account_states for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_reports_insert_self on public.trust_reports;
create policy trust_reports_insert_self
  on public.trust_reports for insert
  with check (reporter_id = auth.uid());

drop policy if exists trust_reports_select_self_or_admin on public.trust_reports;
create policy trust_reports_select_self_or_admin
  on public.trust_reports for select
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_device_signals on public.trust_device_signals;
create policy trust_admin_select_device_signals
  on public.trust_device_signals for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_account_links on public.trust_account_links;
create policy trust_admin_select_account_links
  on public.trust_account_links for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_risk_events on public.trust_risk_events;
create policy trust_admin_select_risk_events
  on public.trust_risk_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_risk_snapshots on public.trust_risk_snapshots;
create policy trust_admin_select_risk_snapshots
  on public.trust_risk_snapshots for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_cases on public.trust_moderation_cases;
create policy trust_admin_select_cases
  on public.trust_moderation_cases for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_case_actions on public.trust_moderation_actions;
create policy trust_admin_select_case_actions
  on public.trust_moderation_actions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_security_events on public.trust_security_events;
create policy trust_admin_select_security_events
  on public.trust_security_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_review_integrity on public.trust_review_integrity_events;
create policy trust_admin_select_review_integrity
  on public.trust_review_integrity_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists trust_admin_select_audit_logs on public.trust_audit_logs;
create policy trust_admin_select_audit_logs
  on public.trust_audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

revoke all on public.trust_device_signals from anon, authenticated;
revoke all on public.trust_account_links from anon, authenticated;
revoke all on public.trust_risk_events from anon, authenticated;
revoke all on public.trust_risk_snapshots from anon, authenticated;
revoke all on public.trust_moderation_cases from anon, authenticated;
revoke all on public.trust_moderation_actions from anon, authenticated;
revoke all on public.trust_security_events from anon, authenticated;
revoke all on public.trust_review_integrity_events from anon, authenticated;
revoke all on public.trust_audit_logs from anon, authenticated;
