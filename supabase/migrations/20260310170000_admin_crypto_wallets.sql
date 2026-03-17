create table if not exists public.admin_crypto_wallets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  network text not null,
  currency text not null,
  address text not null,
  memo_tag text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_crypto_wallets is 'Admin-managed wallet vault for payouts and internal operations';

alter table public.admin_crypto_wallets enable row level security;

drop policy if exists admin_crypto_wallets_no_access on public.admin_crypto_wallets;
create policy admin_crypto_wallets_no_access on public.admin_crypto_wallets
  as restrictive
  for all
  using (false)
  with check (false);

create unique index if not exists admin_crypto_wallets_address_network_uq
  on public.admin_crypto_wallets (lower(address), lower(network));

create index if not exists admin_crypto_wallets_is_active_idx
  on public.admin_crypto_wallets (is_active);
