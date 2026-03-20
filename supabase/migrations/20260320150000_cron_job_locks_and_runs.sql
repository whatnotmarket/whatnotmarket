-- Shared lock + run history for application cron jobs.
-- Used by Node/Actions schedulers to prevent overlapping execution and keep auditability.

create table if not exists public.cron_job_locks (
  job_name text primary key,
  lock_token text not null,
  owner text not null,
  locked_at timestamptz not null default now(),
  lock_until timestamptz not null,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists cron_job_locks_lock_until_idx
  on public.cron_job_locks (lock_until);

create table if not exists public.cron_job_runs (
  id bigserial primary key,
  job_name text not null,
  run_token text,
  owner text,
  status text not null check (status in ('success', 'failed', 'skipped')),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  processed integer not null default 0 check (processed >= 0),
  failed integer not null default 0 check (failed >= 0),
  skipped integer not null default 0 check (skipped >= 0),
  warnings integer not null default 0 check (warnings >= 0),
  memory_mb numeric(10, 2),
  details jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists cron_job_runs_job_started_idx
  on public.cron_job_runs (job_name, started_at desc);

create index if not exists cron_job_runs_status_started_idx
  on public.cron_job_runs (status, started_at desc);

create or replace function public.acquire_cron_job_lock(
  p_job_name text,
  p_owner text,
  p_lease_seconds integer default 900,
  p_lock_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_lease_seconds integer := greatest(coalesce(p_lease_seconds, 900), 30);
  v_token text := coalesce(nullif(trim(p_lock_token), ''), md5(random()::text || clock_timestamp()::text || coalesce(p_job_name, 'job')));
  v_row public.cron_job_locks%rowtype;
begin
  insert into public.cron_job_locks (job_name, lock_token, owner, locked_at, lock_until, updated_at)
  values (p_job_name, v_token, p_owner, v_now, v_now + make_interval(secs => v_lease_seconds), v_now)
  on conflict (job_name)
  do update
    set lock_token = excluded.lock_token,
        owner = excluded.owner,
        locked_at = excluded.locked_at,
        lock_until = excluded.lock_until,
        updated_at = excluded.updated_at
  where public.cron_job_locks.lock_until <= v_now
  returning * into v_row;

  if found then
    return jsonb_build_object(
      'acquired', true,
      'job_name', v_row.job_name,
      'token', v_row.lock_token,
      'owner', v_row.owner,
      'lock_until', v_row.lock_until
    );
  end if;

  select *
  into v_row
  from public.cron_job_locks
  where job_name = p_job_name;

  return jsonb_build_object(
    'acquired', false,
    'job_name', coalesce(v_row.job_name, p_job_name),
    'token', coalesce(v_row.lock_token, ''),
    'owner', coalesce(v_row.owner, ''),
    'lock_until', v_row.lock_until
  );
end;
$$;

create or replace function public.release_cron_job_lock(
  p_job_name text,
  p_lock_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  delete from public.cron_job_locks
  where job_name = p_job_name
    and lock_token = p_lock_token;

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on table public.cron_job_locks from anon, authenticated;
revoke all on table public.cron_job_runs from anon, authenticated;
revoke execute on function public.acquire_cron_job_lock(text, text, integer, text) from public;
revoke execute on function public.release_cron_job_lock(text, text) from public;
grant execute on function public.acquire_cron_job_lock(text, text, integer, text) to service_role;
grant execute on function public.release_cron_job_lock(text, text) to service_role;

