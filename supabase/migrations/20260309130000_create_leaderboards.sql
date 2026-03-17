-- Function to get top sellers by deal count
create or replace function public.get_top_sellers(
  time_range text, -- 'week' or 'month'
  limit_count int default 10
)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  total_deals bigint
)
language plpgsql
security definer
as $$
declare
  start_date timestamptz;
begin
  if time_range = 'week' then
    start_date := now() - interval '1 week';
  else
    start_date := now() - interval '1 month';
  end if;

  return query
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    count(d.id) as total_deals
  from
    public.profiles p
    join public.deals d on d.seller_id = p.id
  where
    d.status = 'completed'
    and d.created_at >= start_date
  group by
    p.id, p.username, p.avatar_url
  order by
    total_deals desc
  limit limit_count;
end;
$$;

-- Function to get top escrow (by volume)
create or replace function public.get_top_escrow(
  time_range text, -- 'week' or 'month'
  limit_count int default 10
)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  total_volume numeric
)
language plpgsql
security definer
as $$
declare
  start_date timestamptz;
begin
  if time_range = 'week' then
    start_date := now() - interval '1 week';
  else
    start_date := now() - interval '1 month';
  end if;

  return query
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    coalesce(sum(o.price), 0) as total_volume
  from
    public.profiles p
    join public.deals d on d.seller_id = p.id
    join public.offers o on d.offer_id = o.id
  where
    d.status = 'completed'
    and d.created_at >= start_date
  group by
    p.id, p.username, p.avatar_url
  order by
    total_volume desc
  limit limit_count;
end;
$$;
