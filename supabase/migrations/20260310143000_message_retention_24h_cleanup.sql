-- Automatic 24h chat message retention cleanup for production.
-- Covers marketplace chats + global chat (including threaded replies).

-- 1) Ensure required extension for recurring jobs is available.
create extension if not exists pg_cron;

-- 2) Performance indexes for created_at-based expiration scans.
create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

create index if not exists idx_chat_messages_created_at
  on public.chat_messages (created_at desc);

create index if not exists idx_global_chat_messages_created_at
  on public.global_chat_messages (created_at desc);

-- 3) Cleanup function.
-- Deletes all chat rows older than 24 hours by default, in controllable batches.
create or replace function public.delete_expired_messages(
  p_retention interval default interval '24 hours',
  p_batch_size integer default 5000
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
  v_cutoff timestamptz := now() - p_retention;
  v_rows bigint;
  v_total_messages bigint := 0;
  v_total_chat_messages bigint := 0;
  v_total_global_chat_messages bigint := 0;
begin
  -- public.messages
  loop
    with victim as (
      select id
      from public.messages
      where created_at < v_cutoff
      order by created_at asc
      limit p_batch_size
    )
    delete from public.messages m
    using victim
    where m.id = victim.id;

    get diagnostics v_rows = row_count;
    v_total_messages := v_total_messages + v_rows;
    exit when v_rows < p_batch_size;
  end loop;

  -- public.chat_messages
  loop
    with victim as (
      select id
      from public.chat_messages
      where created_at < v_cutoff
      order by created_at asc
      limit p_batch_size
    )
    delete from public.chat_messages m
    using victim
    where m.id = victim.id;

    get diagnostics v_rows = row_count;
    v_total_chat_messages := v_total_chat_messages + v_rows;
    exit when v_rows < p_batch_size;
  end loop;

  -- public.global_chat_messages (includes threaded replies)
  -- `reply_to_id` is ON DELETE SET NULL, so deleting old parents is safe.
  loop
    with victim as (
      select id
      from public.global_chat_messages
      where created_at < v_cutoff
      order by created_at asc
      limit p_batch_size
    )
    delete from public.global_chat_messages g
    using victim
    where g.id = victim.id;

    get diagnostics v_rows = row_count;
    v_total_global_chat_messages := v_total_global_chat_messages + v_rows;
    exit when v_rows < p_batch_size;
  end loop;

  return query
  values
    ('messages', v_total_messages),
    ('chat_messages', v_total_chat_messages),
    ('global_chat_messages', v_total_global_chat_messages);
end;
$$;

comment on function public.delete_expired_messages(interval, integer)
  is 'Deletes chat rows older than retention (default 24h) from messages, chat_messages, and global_chat_messages in batches.';

-- Restrict direct execution from client roles.
revoke execute on function public.delete_expired_messages(interval, integer) from public;

-- 4) Schedule recurring cleanup job with pg_cron.
-- Recreate the job idempotently so migration can be re-run safely.
do $$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname = 'cleanup_old_messages_job'
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  -- Every 10 minutes keeps table size under control with smooth load.
  perform cron.schedule(
    'cleanup_old_messages_job',
    '*/10 * * * *',
    $job$select public.delete_expired_messages('24 hours', 5000);$job$
  );
end;
$$;
