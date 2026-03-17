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

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'listing_payment_status' and n.nspname = 'public'
  ) then
    create type public.listing_payment_status as enum (
      'pending',
      'funded_to_escrow',
      'awaiting_release',
      'released',
      'failed',
      'cancelled'
    );
  end if;
end $$;

create table if not exists public.auth_bridge_identities (
  auth_subject text primary key,
  provider text not null,
  supabase_user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists auth_bridge_identities_user_idx
  on public.auth_bridge_identities (supabase_user_id);

create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address text not null,
  chain text not null,
  provider text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wallets_user_address_chain_key
  on public.wallets (user_id, address, chain);

create index if not exists wallets_user_idx on public.wallets (user_id);
create index if not exists wallets_address_chain_idx on public.wallets (address, chain);

create table if not exists public.listing_payments (
  id uuid primary key default uuid_generate_v4(),
  listing_id text not null,
  payer_user_id uuid not null references public.profiles(id) on delete cascade,
  payee_user_id uuid references public.profiles(id) on delete set null,
  payer_wallet_address text not null,
  target_wallet_address text not null,
  amount numeric not null check (amount > 0),
  currency text not null,
  chain text not null,
  status public.listing_payment_status not null default 'pending'::public.listing_payment_status,
  escrow_reference text not null unique,
  tx_hash_in text,
  tx_hash_out text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists listing_payments_payer_idempotency_key
  on public.listing_payments (payer_user_id, idempotency_key);

create index if not exists listing_payments_listing_idx on public.listing_payments (listing_id);
create index if not exists listing_payments_status_idx on public.listing_payments (status, created_at desc);
create index if not exists listing_payments_payer_idx on public.listing_payments (payer_user_id);
create index if not exists listing_payments_payee_idx on public.listing_payments (payee_user_id);

create table if not exists public.escrow_actions (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references public.listing_payments(id) on delete cascade,
  action_type text not null,
  performed_by_user_id uuid references public.profiles(id) on delete set null,
  notes text,
  tx_hash text,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists escrow_actions_payment_idempotency
  on public.escrow_actions (payment_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists escrow_actions_payment_idx on public.escrow_actions (payment_id, created_at desc);
create index if not exists escrow_actions_actor_idx on public.escrow_actions (performed_by_user_id);

alter table public.auth_bridge_identities enable row level security;
alter table public.wallets enable row level security;
alter table public.listing_payments enable row level security;
alter table public.escrow_actions enable row level security;

drop policy if exists auth_bridge_identities_admin_read on public.auth_bridge_identities;
create policy auth_bridge_identities_admin_read
  on public.auth_bridge_identities
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists wallets_select_owner_or_admin on public.wallets;
create policy wallets_select_owner_or_admin
  on public.wallets
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists wallets_insert_owner on public.wallets;
create policy wallets_insert_owner
  on public.wallets
  for insert
  with check (user_id = auth.uid());

drop policy if exists wallets_update_owner on public.wallets;
create policy wallets_update_owner
  on public.wallets
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists listing_payments_select_participants_or_admin on public.listing_payments;
create policy listing_payments_select_participants_or_admin
  on public.listing_payments
  for select
  using (
    payer_user_id = auth.uid()
    or payee_user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists listing_payments_insert_payer on public.listing_payments;
create policy listing_payments_insert_payer
  on public.listing_payments
  for insert
  with check (payer_user_id = auth.uid());

drop policy if exists listing_payments_payer_cancel on public.listing_payments;
create policy listing_payments_payer_cancel
  on public.listing_payments
  for update
  using (payer_user_id = auth.uid() and status = 'pending'::public.listing_payment_status)
  with check (payer_user_id = auth.uid());

drop policy if exists listing_payments_admin_update on public.listing_payments;
create policy listing_payments_admin_update
  on public.listing_payments
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

drop policy if exists escrow_actions_select_participants_or_admin on public.escrow_actions;
create policy escrow_actions_select_participants_or_admin
  on public.escrow_actions
  for select
  using (
    exists (
      select 1
      from public.listing_payments lp
      where lp.id = payment_id
        and (lp.payer_user_id = auth.uid() or lp.payee_user_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists escrow_actions_insert_actor_or_admin on public.escrow_actions;
create policy escrow_actions_insert_actor_or_admin
  on public.escrow_actions
  for insert
  with check (
    performed_by_user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop trigger if exists set_auth_bridge_identities_updated_at on public.auth_bridge_identities;
create trigger set_auth_bridge_identities_updated_at
before update on public.auth_bridge_identities
for each row execute function public.set_updated_at();

drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

drop trigger if exists set_listing_payments_updated_at on public.listing_payments;
create trigger set_listing_payments_updated_at
before update on public.listing_payments
for each row execute function public.set_updated_at();
