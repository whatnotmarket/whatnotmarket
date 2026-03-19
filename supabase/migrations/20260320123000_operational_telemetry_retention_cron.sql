-- Retention cron for operational telemetry tables.
-- Keeps analytics/security data bounded without impacting product records.

create extension if not exists pg_cron;

create or replace function public.cleanup_operational_telemetry(
  p_search_retention interval default interval '120 days',
  p_abuse_retention interval default interval '180 days',
  p_batch_size integer default 10000
)
returns table (
  table_name text,
  deleted_rows bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff_search timestamptz := now() - p_search_retention;
  v_cutoff_abuse timestamptz := now() - p_abuse_retention;
  v_rows bigint;
  v_total_search bigint := 0;
  v_total_abuse bigint := 0;
begin
  loop
    with victim as (
      select id
      from public.search_query_events
      where created_at < v_cutoff_search
      order by created_at asc
      limit p_batch_size
    )
    delete from public.search_query_events s
    using victim
    where s.id = victim.id;

    get diagnostics v_rows = row_count;
    v_total_search := v_total_search + v_rows;
    exit when v_rows < p_batch_size;
  end loop;

  loop
    with victim as (
      select id
      from public.security_abuse_events
      where created_at < v_cutoff_abuse
      order by created_at asc
      limit p_batch_size
    )
    delete from public.security_abuse_events a
    using victim
    where a.id = victim.id;

    get diagnostics v_rows = row_count;
    v_total_abuse := v_total_abuse + v_rows;
    exit when v_rows < p_batch_size;
  end loop;

  return query
  values
    ('search_query_events', v_total_search),
    ('security_abuse_events', v_total_abuse);
end;
$$;

comment on function public.cleanup_operational_telemetry(interval, interval, integer)
  is 'Deletes old rows from search_query_events and security_abuse_events in batches.';

revoke execute on function public.cleanup_operational_telemetry(interval, interval, integer) from public;

do $$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname = 'cleanup_operational_telemetry_job'
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  -- Daily at 03:17 UTC.
  perform cron.schedule(
    'cleanup_operational_telemetry_job',
    '17 3 * * *',
    $job$select public.cleanup_operational_telemetry('120 days', '180 days', 10000);$job$
  );
end;
$$;
