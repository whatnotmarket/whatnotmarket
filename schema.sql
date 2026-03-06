-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  email text,
  
  -- Onboarding & Seller Verification
  role_preference text check (role_preference in ('buyer', 'seller', 'both')),
  onboarding_status text default 'started' check (onboarding_status in ('started', 'completed')),
  seller_status text default 'unverified' check (seller_status in ('unverified', 'pending_telegram', 'verified', 'rejected')),
  
  -- Payout Info
  payout_address text,
  payout_network text,
  payout_currency text,
  fee_acknowledged_at timestamptz,
  
  -- Telegram Info
  telegram_user_id text,
  telegram_username text,

  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- INVITE CODES
create type invite_status as enum ('active', 'used', 'revoked');

create table public.invite_codes (
  code text primary key,
  status invite_status default 'active',
  created_by uuid references public.profiles(id),
  used_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.invite_codes enable row level security;

-- Only admins can see all invites or create them. 
-- For MVP, let's allow public read of *active* invites so we can validate them on the client without auth.
create policy "Anyone can check if an invite is active"
  on invite_codes for select
  using ( status = 'active' );

-- REQUESTS
create type request_status as enum ('open', 'accepted', 'closed');

create table public.requests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text not null,
  budget_min numeric,
  budget_max numeric,
  location text,
  condition text,
  status request_status default 'open',
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

alter table public.requests enable row level security;

create policy "Requests are viewable by everyone."
  on requests for select
  using ( true );

create policy "Authenticated users can create requests."
  on requests for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update own requests."
  on requests for update
  using ( auth.uid() = created_by );

-- OFFERS
create type offer_status as enum ('pending', 'accepted', 'rejected');

create table public.offers (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(id) not null,
  price numeric not null,
  message text,
  status offer_status default 'pending',
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

alter table public.offers enable row level security;

create policy "Offers are viewable by the creator and the request owner."
  on offers for select
  using ( 
    auth.uid() = created_by or 
    exists (
      select 1 from requests 
      where requests.id = offers.request_id 
      and requests.created_by = auth.uid()
    )
  );

create policy "Authenticated users can create offers."
  on offers for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update own offers."
  on offers for update
  using ( auth.uid() = created_by );

-- DEALS
create type deal_status as enum ('verification', 'completed', 'cancelled');

create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(id) not null,
  offer_id uuid references public.offers(id) not null,
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.profiles(id) not null,
  status deal_status default 'verification',
  created_at timestamptz default now()
);

alter table public.deals enable row level security;

create policy "Deals are viewable by participants."
  on deals for select
  using ( auth.uid() = buyer_id or auth.uid() = seller_id );

-- MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Messages are viewable by deal participants."
  on messages for select
  using ( 
    exists (
      select 1 from deals 
      where deals.id = messages.deal_id 
      and (deals.buyer_id = auth.uid() or deals.seller_id = auth.uid())
    )
  );

create policy "Participants can insert messages."
  on messages for insert
  with check ( 
    exists (
      select 1 from deals 
      where deals.id = messages.deal_id 
      and (deals.buyer_id = auth.uid() or deals.seller_id = auth.uid())
    )
  );

-- SELLER VERIFICATIONS
create type verification_status as enum ('issued', 'used', 'expired');

create table public.seller_verifications (
  id uuid default uuid_generate_v4() primary key,
  telegram_user_id text,
  telegram_username text,
  verification_code_hash text not null,
  issued_at timestamptz default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_user_id uuid references public.profiles(id),
  status verification_status default 'issued',
  metadata jsonb
);

alter table public.seller_verifications enable row level security;

create policy "Admins can view verifications"
  on seller_verifications for select
  using ( exists (select 1 from profiles where id = auth.uid() and is_admin = true) );

-- PAYMENTS & CATALOG

-- NETWORKS
create table public.networks (
  id text primary key, -- e.g. 'ethereum-mainnet'
  name text not null,
  type text not null, -- 'EVM', 'UTXO', 'ACCOUNT'
  chain_id text,
  explorer_url text,
  requires_memo_tag boolean default false
);

alter table public.networks enable row level security;
create policy "Networks are viewable by everyone" on networks for select using (true);

-- CURRENCIES
create table public.currencies (
  id text primary key, -- e.g. 'USDC-ETH'
  symbol text not null,
  decimals integer not null,
  contract_address text,
  network_id text references public.networks(id),
  is_stablecoin boolean default false
);

alter table public.currencies enable row level security;
create policy "Currencies are viewable by everyone" on currencies for select using (true);

-- SUPPORT MATRIX (Which adapter supports which currency)
create table public.support_matrix (
  id uuid default uuid_generate_v4() primary key,
  network_id text references public.networks(id),
  currency_id text references public.currencies(id),
  adapter_type text not null -- 'provider', 'native_evm', etc.
);

alter table public.support_matrix enable row level security;
create policy "Support matrix is viewable by everyone" on support_matrix for select using (true);

-- PAYMENT INTENTS
create type payment_status as enum ('created', 'awaiting_payment', 'detected', 'confirming', 'funded', 'released', 'refunded', 'disputed', 'failed');

create table public.payment_intents (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) not null,
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.profiles(id) not null,
  adapter_type text not null,
  pay_chain_id text not null,
  pay_token_id text not null,
  expected_amount numeric not null,
  deposit_address text not null,
  memo_tag text,
  expires_at timestamptz,
  status payment_status default 'created',
  detected_tx_hash text,
  detected_block numeric,
  confirmations integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payment_intents enable row level security;

create policy "Payment intents viewable by participants and admin"
  on payment_intents for select
  using ( 
    auth.uid() = buyer_id or 
    auth.uid() = seller_id or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Buyers can create payment intents"
  on payment_intents for insert
  with check ( auth.uid() = buyer_id );

-- PAYOUT INSTRUCTIONS
create table public.payout_instructions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  payout_network text not null,
  payout_currency text not null,
  payout_address text not null,
  payout_memo_tag text,
  kyc_status text default 'unverified',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payout_instructions enable row level security;

create policy "Users can manage own payout instructions"
  on payout_instructions for all
  using ( auth.uid() = user_id );

-- LEDGER ENTRIES
create type ledger_type as enum ('deposit', 'fee', 'payout', 'refund', 'adjustment');

create table public.ledger_entries (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id),
  type ledger_type not null,
  currency text not null,
  network text not null,
  amount numeric not null,
  tx_hash text,
  created_at timestamptz default now()
);

alter table public.ledger_entries enable row level security;

create policy "Admins can view ledger"
  on ledger_entries for select
  using ( exists (select 1 from profiles where id = auth.uid() and is_admin = true) );

-- AUDIT LOGS
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_id uuid,
  target_type text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can view audit logs"
  on audit_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and is_admin = true) );

-- TRIGGER for new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
