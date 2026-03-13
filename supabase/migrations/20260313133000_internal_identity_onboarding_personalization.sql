alter table if exists public.internal_identities
  add column if not exists discovery_source text,
  add column if not exists user_intent text,
  add column if not exists seller_category text,
  add column if not exists buyer_interest text;

update public.internal_identities
set discovery_source = coalesce(discovery_source, 'unknown'),
    user_intent = coalesce(user_intent, case when is_seller then 'sell' else 'buy' end)
where discovery_source is null
   or user_intent is null;

alter table if exists public.internal_identities
  alter column discovery_source set not null,
  alter column user_intent set not null;

alter table if exists public.internal_identities
  drop constraint if exists internal_identities_user_intent_check;

alter table if exists public.internal_identities
  add constraint internal_identities_user_intent_check
  check (user_intent in ('buy', 'sell', 'both'));

create index if not exists internal_identities_discovery_source_idx
  on public.internal_identities (discovery_source);

create index if not exists internal_identities_user_intent_idx
  on public.internal_identities (user_intent);
