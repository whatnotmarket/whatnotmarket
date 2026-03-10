-- Persistent anti-abuse telemetry used for cross-endpoint and cross-account velocity checks.

create table if not exists public.security_abuse_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  action text not null,
  endpoint_group text not null default 'generic',
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text not null,
  device_hash text not null,
  blocked boolean not null default false,
  risk_score integer not null default 0 check (risk_score >= 0),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists security_abuse_events_created_at_idx
  on public.security_abuse_events (created_at desc);

create index if not exists security_abuse_events_ip_hash_created_at_idx
  on public.security_abuse_events (ip_hash, created_at desc);

create index if not exists security_abuse_events_device_hash_created_at_idx
  on public.security_abuse_events (device_hash, created_at desc);

create index if not exists security_abuse_events_user_id_created_at_idx
  on public.security_abuse_events (user_id, created_at desc);

create index if not exists security_abuse_events_action_created_at_idx
  on public.security_abuse_events (action, created_at desc);

alter table public.security_abuse_events enable row level security;

revoke all on public.security_abuse_events from anon;
revoke all on public.security_abuse_events from authenticated;
