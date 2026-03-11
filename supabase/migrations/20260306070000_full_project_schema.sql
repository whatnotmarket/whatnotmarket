-- Full Supabase schema bootstrap for SwaprMarket.
-- Safe to run on fresh projects and idempotent for repeat runs.

create extension if not exists "uuid-ossp";

-- ENUMS ----------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'invite_status' and n.nspname = 'public'
  ) then
    create type public.invite_status as enum ('active', 'used', 'revoked');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'request_status' and n.nspname = 'public'
  ) then
    create type public.request_status as enum ('open', 'accepted', 'closed');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'offer_status' and n.nspname = 'public'
  ) then
    create type public.offer_status as enum ('pending', 'accepted', 'rejected');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'deal_status' and n.nspname = 'public'
  ) then
    create type public.deal_status as enum ('verification', 'completed', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'verification_status' and n.nspname = 'public'
  ) then
    create type public.verification_status as enum ('issued', 'used', 'expired');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'payment_status' and n.nspname = 'public'
  ) then
    create type public.payment_status as enum (
      'created',
      'awaiting_payment',
      'detected',
      'confirming',
      'funded',
      'released',
      'refunded',
      'disputed',
      'failed'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'ledger_type' and n.nspname = 'public'
  ) then
    create type public.ledger_type as enum ('deposit', 'fee', 'payout', 'refund', 'adjustment');
  end if;
end $$;

-- TABLES ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  email text,
  role_preference text check (role_preference in ('buyer', 'seller', 'both')),
  onboarding_status text not null default 'started' check (onboarding_status in ('started', 'completed')),
  seller_status text not null default 'unverified' check (seller_status in ('unverified', 'pending_telegram', 'verified', 'rejected')),
  payout_address text,
  payout_network text,
  payout_currency text,
  fee_acknowledged_at timestamptz,
  telegram_user_id text,
  telegram_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  code text primary key,
  status public.invite_status not null default 'active'::public.invite_status,
  created_by uuid references public.profiles(id),
  used_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text not null,
  budget_min numeric,
  budget_max numeric,
  location text,
  condition text,
  status public.request_status not null default 'open'::public.request_status,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid not null references public.requests(id) on delete cascade,
  price numeric not null,
  message text,
  status public.offer_status not null default 'pending'::public.offer_status,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid not null references public.requests(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status public.deal_status not null default 'verification'::public.deal_status,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_verifications (
  id uuid primary key default uuid_generate_v4(),
  telegram_user_id text,
  telegram_username text,
  verification_code_hash text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_user_id uuid references public.profiles(id),
  status public.verification_status not null default 'issued'::public.verification_status,
  metadata jsonb
);

create table if not exists public.networks (
  id text primary key,
  name text not null,
  type text not null,
  chain_id text,
  explorer_url text,
  requires_memo_tag boolean not null default false
);

create table if not exists public.currencies (
  id text primary key,
  symbol text not null,
  decimals integer not null,
  contract_address text,
  network_id text references public.networks(id) on delete cascade,
  is_stablecoin boolean not null default false
);

create table if not exists public.support_matrix (
  id uuid primary key default uuid_generate_v4(),
  network_id text not null references public.networks(id) on delete cascade,
  currency_id text not null references public.currencies(id) on delete cascade,
  adapter_type text not null
);

create table if not exists public.payment_intents (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  adapter_type text not null,
  pay_chain_id text not null,
  pay_token_id text not null,
  expected_amount numeric not null check (expected_amount > 0),
  deposit_address text not null,
  memo_tag text,
  expires_at timestamptz,
  status public.payment_status not null default 'created'::public.payment_status,
  detected_tx_hash text,
  detected_block numeric,
  confirmations integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payout_instructions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payout_network text not null,
  payout_currency text not null,
  payout_address text not null,
  payout_memo_tag text,
  kyc_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references public.deals(id) on delete set null,
  type public.ledger_type not null,
  currency text not null,
  network text not null,
  amount numeric not null,
  tx_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_id uuid,
  target_type text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

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

-- Additional constraints ------------------------------------------------------

-- Keep only one row per (network_id, currency_id, adapter_type) before adding unique constraint.
delete from public.support_matrix a
using public.support_matrix b
where a.ctid < b.ctid
  and a.network_id = b.network_id
  and a.currency_id = b.currency_id
  and a.adapter_type = b.adapter_type;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_matrix_network_currency_adapter_key'
      and conrelid = 'public.support_matrix'::regclass
  ) then
    alter table public.support_matrix
      add constraint support_matrix_network_currency_adapter_key
      unique (network_id, currency_id, adapter_type);
  end if;
end $$;

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

-- INDEXES --------------------------------------------------------------------

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists invite_codes_status_idx on public.invite_codes (status);
create index if not exists invite_codes_expires_at_idx on public.invite_codes (expires_at);

create index if not exists requests_created_by_idx on public.requests (created_by);
create index if not exists requests_status_created_at_idx on public.requests (status, created_at desc);

create index if not exists offers_request_id_idx on public.offers (request_id);
create index if not exists offers_created_by_idx on public.offers (created_by);

create index if not exists deals_request_id_idx on public.deals (request_id);
create index if not exists deals_buyer_id_idx on public.deals (buyer_id);
create index if not exists deals_seller_id_idx on public.deals (seller_id);

create index if not exists messages_deal_id_idx on public.messages (deal_id);
create index if not exists messages_created_at_idx on public.messages (created_at desc);

create index if not exists seller_verifications_status_idx on public.seller_verifications (status);
create index if not exists seller_verifications_expires_at_idx on public.seller_verifications (expires_at);

create index if not exists currencies_network_id_idx on public.currencies (network_id);
create index if not exists support_matrix_network_idx on public.support_matrix (network_id);
create index if not exists support_matrix_currency_idx on public.support_matrix (currency_id);

create index if not exists payment_intents_deal_id_idx on public.payment_intents (deal_id);
create index if not exists payment_intents_buyer_id_idx on public.payment_intents (buyer_id);
create index if not exists payment_intents_seller_id_idx on public.payment_intents (seller_id);
create index if not exists payment_intents_status_created_at_idx on public.payment_intents (status, created_at desc);

create index if not exists payout_instructions_user_id_idx on public.payout_instructions (user_id);

create index if not exists ledger_entries_deal_id_idx on public.ledger_entries (deal_id);
create index if not exists ledger_entries_created_at_idx on public.ledger_entries (created_at desc);

create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

create index if not exists proxy_orders_created_at_idx on public.proxy_orders (created_at desc);
create index if not exists proxy_orders_status_idx on public.proxy_orders (status);

-- TRIGGERS -------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        email = coalesce(excluded.email, public.profiles.email),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_intents_updated_at on public.payment_intents;
create trigger set_payment_intents_updated_at
before update on public.payment_intents
for each row execute function public.set_updated_at();

drop trigger if exists set_payout_instructions_updated_at on public.payout_instructions;
create trigger set_payout_instructions_updated_at
before update on public.payout_instructions
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS ------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.requests enable row level security;
alter table public.offers enable row level security;
alter table public.deals enable row level security;
alter table public.messages enable row level security;
alter table public.seller_verifications enable row level security;
alter table public.networks enable row level security;
alter table public.currencies enable row level security;
alter table public.support_matrix enable row level security;
alter table public.payment_intents enable row level security;
alter table public.payout_instructions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.audit_logs enable row level security;
alter table public.proxy_orders enable row level security;

-- POLICIES -------------------------------------------------------------------

-- Profiles
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists profiles_select_public on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_select_public
  on public.profiles for select
  using (true);

create policy profiles_insert_self
  on public.profiles for insert
  with check (auth.uid() = id);

create policy profiles_update_self
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Invite codes
drop policy if exists "Anyone can check if an invite is active" on public.invite_codes;
drop policy if exists invite_codes_select_active on public.invite_codes;
drop policy if exists invite_codes_admin_all on public.invite_codes;

create policy invite_codes_select_active
  on public.invite_codes for select
  using (
    status = 'active'::public.invite_status
    and (expires_at is null or expires_at > now())
  );

create policy invite_codes_admin_all
  on public.invite_codes for all
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

-- Requests
drop policy if exists "Requests are viewable by everyone." on public.requests;
drop policy if exists "Authenticated users can create requests." on public.requests;
drop policy if exists "Users can update own requests." on public.requests;
drop policy if exists requests_select_public on public.requests;
drop policy if exists requests_insert_authenticated on public.requests;
drop policy if exists requests_update_owner_or_admin on public.requests;
drop policy if exists requests_delete_owner_or_admin on public.requests;

create policy requests_select_public
  on public.requests for select
  using (true);

create policy requests_insert_authenticated
  on public.requests for insert
  with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy requests_update_owner_or_admin
  on public.requests for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy requests_delete_owner_or_admin
  on public.requests for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Offers
drop policy if exists "Offers are viewable by the creator and the request owner." on public.offers;
drop policy if exists "Authenticated users can create offers." on public.offers;
drop policy if exists "Users can update own offers." on public.offers;
drop policy if exists offers_select_participants on public.offers;
drop policy if exists offers_insert_authenticated on public.offers;
drop policy if exists offers_update_owner_or_admin on public.offers;
drop policy if exists offers_delete_owner_or_admin on public.offers;

create policy offers_select_participants
  on public.offers for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.created_by = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy offers_insert_authenticated
  on public.offers for insert
  with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy offers_update_owner_or_admin
  on public.offers for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy offers_delete_owner_or_admin
  on public.offers for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Deals
drop policy if exists "Deals are viewable by participants." on public.deals;
drop policy if exists deals_select_participants_or_admin on public.deals;
drop policy if exists deals_insert_buyer_or_admin on public.deals;
drop policy if exists deals_update_participants_or_admin on public.deals;

create policy deals_select_participants_or_admin
  on public.deals for select
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy deals_insert_buyer_or_admin
  on public.deals for insert
  with check (
    (auth.role() = 'authenticated' and buyer_id = auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy deals_update_participants_or_admin
  on public.deals for update
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Messages
drop policy if exists "Messages are viewable by deal participants." on public.messages;
drop policy if exists "Participants can insert messages." on public.messages;
drop policy if exists messages_select_participants_or_admin on public.messages;
drop policy if exists messages_insert_participants on public.messages;
drop policy if exists messages_update_participants_or_admin on public.messages;

create policy messages_select_participants_or_admin
  on public.messages for select
  using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy messages_insert_participants
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
  );

create policy messages_update_participants_or_admin
  on public.messages for update
  using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Seller verifications
drop policy if exists "Admins can view verifications" on public.seller_verifications;
drop policy if exists seller_verifications_admin_all on public.seller_verifications;

create policy seller_verifications_admin_all
  on public.seller_verifications for all
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

-- Networks
drop policy if exists "Networks are viewable by everyone" on public.networks;
drop policy if exists networks_select_public on public.networks;
drop policy if exists networks_admin_all on public.networks;

create policy networks_select_public
  on public.networks for select
  using (true);

create policy networks_admin_all
  on public.networks for all
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

-- Currencies
drop policy if exists "Currencies are viewable by everyone" on public.currencies;
drop policy if exists currencies_select_public on public.currencies;
drop policy if exists currencies_admin_all on public.currencies;

create policy currencies_select_public
  on public.currencies for select
  using (true);

create policy currencies_admin_all
  on public.currencies for all
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

-- Support matrix
drop policy if exists "Support matrix is viewable by everyone" on public.support_matrix;
drop policy if exists support_matrix_select_public on public.support_matrix;
drop policy if exists support_matrix_admin_all on public.support_matrix;

create policy support_matrix_select_public
  on public.support_matrix for select
  using (true);

create policy support_matrix_admin_all
  on public.support_matrix for all
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

-- Payment intents
drop policy if exists "Payment intents viewable by participants and admin" on public.payment_intents;
drop policy if exists "Buyers can create payment intents" on public.payment_intents;
drop policy if exists payment_intents_select_participants_or_admin on public.payment_intents;
drop policy if exists payment_intents_insert_buyer_or_admin on public.payment_intents;
drop policy if exists payment_intents_update_participants_or_admin on public.payment_intents;
drop policy if exists payment_intents_delete_admin on public.payment_intents;

create policy payment_intents_select_participants_or_admin
  on public.payment_intents for select
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy payment_intents_insert_buyer_or_admin
  on public.payment_intents for insert
  with check (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy payment_intents_update_participants_or_admin
  on public.payment_intents for update
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy payment_intents_delete_admin
  on public.payment_intents for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Payout instructions
drop policy if exists "Users can manage own payout instructions" on public.payout_instructions;
drop policy if exists payout_instructions_manage_own on public.payout_instructions;
drop policy if exists payout_instructions_admin_select on public.payout_instructions;

create policy payout_instructions_manage_own
  on public.payout_instructions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy payout_instructions_admin_select
  on public.payout_instructions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Ledger entries
drop policy if exists "Admins can view ledger" on public.ledger_entries;
drop policy if exists ledger_entries_admin_select on public.ledger_entries;
drop policy if exists ledger_entries_admin_insert on public.ledger_entries;

create policy ledger_entries_admin_select
  on public.ledger_entries for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy ledger_entries_admin_insert
  on public.ledger_entries for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Audit logs
drop policy if exists "Admins can view audit logs" on public.audit_logs;
drop policy if exists audit_logs_admin_select on public.audit_logs;
drop policy if exists audit_logs_admin_insert on public.audit_logs;

create policy audit_logs_admin_select
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy audit_logs_admin_insert
  on public.audit_logs for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Proxy orders
drop policy if exists "Admins can view all proxy orders" on public.proxy_orders;
drop policy if exists "Admins can update proxy orders" on public.proxy_orders;
drop policy if exists proxy_orders_admin_read on public.proxy_orders;
drop policy if exists proxy_orders_admin_update on public.proxy_orders;

create policy proxy_orders_admin_read
  on public.proxy_orders for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy proxy_orders_admin_update
  on public.proxy_orders for update
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

-- Realtime publication --------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'deals'
    ) then
      alter publication supabase_realtime add table public.deals;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'payment_intents'
    ) then
      alter publication supabase_realtime add table public.payment_intents;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'proxy_orders'
    ) then
      alter publication supabase_realtime add table public.proxy_orders;
    end if;
  end if;
end $$;
