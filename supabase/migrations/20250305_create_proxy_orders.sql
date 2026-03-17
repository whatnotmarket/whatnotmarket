-- Create table for proxy orders
create table if not exists public.proxy_orders (
  id text primary key,
  tracking_id text unique not null,
  product_url text not null,
  product_name text,
  price numeric not null,
  quantity integer not null default 1,
  currency text not null,
  network text,
  total_paid numeric not null,
  telegram_username text,
  status text not null default 'CREATED',
  updates jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  city text,
  country text,
  region text,
  locker_details jsonb
);

-- Constrain allowed statuses used by the app timeline.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'proxy_orders_status_check'
      and conrelid = 'public.proxy_orders'::regclass
  ) then
    alter table public.proxy_orders
      add constraint proxy_orders_status_check
      check (
        status in (
          'CREATED',
          'PLACED',
          'PROCESSING',
          'LOCKER_ASSIGNED',
          'READY_FOR_PICKUP',
          'PICKED_UP',
          'COMPLETED',
          'CANCELLED'
        )
      );
  end if;
end $$;

-- Enable RLS.
alter table public.proxy_orders enable row level security;

-- Access is intentionally handled through the service-role client in server routes.
-- With RLS enabled and no anon/authenticated policies, direct client access is denied.

create index if not exists proxy_orders_created_at_idx
  on public.proxy_orders (created_at desc);

create index if not exists proxy_orders_status_idx
  on public.proxy_orders (status);
