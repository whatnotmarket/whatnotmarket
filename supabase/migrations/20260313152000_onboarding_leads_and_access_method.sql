create table if not exists public.onboarding_leads (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null unique,
  discovery_source text,
  user_intent text,
  seller_category text,
  buyer_interest text,
  seller_name text,
  reviews_channel text,
  escrow_experience text,
  seller_notes text,
  bio text,
  x_handle text,
  selected_access_method text,
  completed_identity boolean not null default false,
  internal_identity_id uuid references public.internal_identities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_leads_user_intent_check
    check (user_intent is null or user_intent in ('buy', 'sell', 'both')),
  constraint onboarding_leads_access_method_check
    check (selected_access_method is null or selected_access_method in ('recovery_phrase', 'google_mock', 'apple_mock'))
);

create index if not exists onboarding_leads_created_at_idx
  on public.onboarding_leads (created_at desc);

create index if not exists onboarding_leads_access_method_idx
  on public.onboarding_leads (selected_access_method);

alter table if exists public.internal_identities
  add column if not exists access_method text;

alter table if exists public.internal_identities
  drop constraint if exists internal_identities_access_method_check;

alter table if exists public.internal_identities
  add constraint internal_identities_access_method_check
  check (access_method is null or access_method in ('recovery_phrase', 'google_mock', 'apple_mock'));

create index if not exists internal_identities_access_method_idx
  on public.internal_identities (access_method);
