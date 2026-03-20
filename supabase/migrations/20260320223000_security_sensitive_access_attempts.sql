-- Sensitive route access telemetry for security alerting.

create extension if not exists pgcrypto;

create table if not exists public.security_sensitive_access_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  route_path text not null,
  request_method text not null,
  ip_address text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  notified_at timestamptz,
  notification_error text,
  notification_attempts integer not null default 0,
  constraint security_sensitive_access_attempts_method_upper_chk check (request_method = upper(request_method))
);

create index if not exists security_sensitive_access_attempts_created_at_idx
  on public.security_sensitive_access_attempts (created_at desc);

create index if not exists security_sensitive_access_attempts_notified_created_at_idx
  on public.security_sensitive_access_attempts (notified_at, created_at asc);

create index if not exists security_sensitive_access_attempts_route_created_at_idx
  on public.security_sensitive_access_attempts (route_path, created_at desc);

alter table public.security_sensitive_access_attempts enable row level security;
revoke all on table public.security_sensitive_access_attempts from anon, authenticated;
