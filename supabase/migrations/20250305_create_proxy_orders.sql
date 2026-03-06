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

-- Enable RLS
alter table public.proxy_orders enable row level security;

-- Policies
-- Allow public insert (anyone can create an order) or restrict to authenticated users?
-- Since the original code allowed anyone to POST to /api/orders/create, we should allow public inserts or handle it via admin client.
-- The current implementation uses admin client which bypasses RLS, so policies are less critical for the write operation but good for read.

-- Allow users to read their own orders?
-- Currently there is no user_id associated with proxy orders (they are guest orders with tracking ID).
-- So reading is done by tracking ID or admin access.

-- Admin access policy
create policy "Admins can view all proxy orders"
  on proxy_orders for select
  using ( exists (select 1 from profiles where id = auth.uid() and is_admin = true) );

create policy "Admins can update proxy orders"
  on proxy_orders for update
  using ( exists (select 1 from profiles where id = auth.uid() and is_admin = true) );
