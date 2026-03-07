-- Admin platform wallet vault for treasury and operational payout addresses.

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'set_updated_at' and n.nspname = 'public'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

create table if not exists public.admin_crypto_wallets (
  id uuid primary key default uuid_generate_v4(),
  label text,
  network text not null,
  currency text not null,
  address text not null,
  memo_tag text,
  is_active boolean not null default true,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_crypto_wallets_unique_wallet
  on public.admin_crypto_wallets (network, currency, address);

create index if not exists admin_crypto_wallets_active_idx
  on public.admin_crypto_wallets (is_active, network, currency);

alter table public.admin_crypto_wallets enable row level security;

drop policy if exists admin_crypto_wallets_admin_read on public.admin_crypto_wallets;
create policy admin_crypto_wallets_admin_read
  on public.admin_crypto_wallets
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists admin_crypto_wallets_admin_insert on public.admin_crypto_wallets;
create policy admin_crypto_wallets_admin_insert
  on public.admin_crypto_wallets
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists admin_crypto_wallets_admin_update on public.admin_crypto_wallets;
create policy admin_crypto_wallets_admin_update
  on public.admin_crypto_wallets
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists admin_crypto_wallets_admin_delete on public.admin_crypto_wallets;
create policy admin_crypto_wallets_admin_delete
  on public.admin_crypto_wallets
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop trigger if exists set_admin_crypto_wallets_updated_at on public.admin_crypto_wallets;
create trigger set_admin_crypto_wallets_updated_at
before update on public.admin_crypto_wallets
for each row execute function public.set_updated_at();
