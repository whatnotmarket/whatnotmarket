-- Improve trending quality by tracking per-session search events.
alter table if exists public.search_query_events
  add column if not exists session_key text;

create index if not exists search_query_events_session_created_at_idx
  on public.search_query_events (session_key, created_at desc);

-- Real trending terms weighted by engagement and unique sessions.
create or replace function public.get_trending_searches(
  hours_window integer default 168,
  limit_count integer default 8,
  scope_filter text default null
)
returns table(query text, search_count bigint)
language sql
stable
as $$
  with filtered as (
    select
      sqe.id,
      sqe.query_norm,
      sqe.selected_item_id,
      sqe.created_at,
      coalesce(nullif(sqe.session_key, ''), 'legacy:' || sqe.id::text) as session_key
    from public.search_query_events sqe
    where sqe.created_at >= now() - make_interval(hours => greatest(hours_window, 1))
      and (scope_filter is null or sqe.scope = scope_filter)
      and char_length(trim(sqe.query_norm)) >= 2
  ),
  aggregated as (
    select
      query_norm as query,
      (count(*) + (count(*) filter (where selected_item_id is not null) * 2))::bigint as search_count,
      count(distinct session_key) as unique_sessions,
      max(created_at) as last_seen
    from filtered
    group by query_norm
  )
  select
    aggregated.query,
    aggregated.search_count
  from aggregated
  where aggregated.search_count >= 2
    and aggregated.unique_sessions >= 2
  order by aggregated.search_count desc, aggregated.last_seen desc
  limit greatest(limit_count, 1);
$$;

