alter table if exists public.internal_identities
  add column if not exists seller_name text,
  add column if not exists reviews_channel text,
  add column if not exists escrow_experience text,
  add column if not exists seller_notes text;

create index if not exists internal_identities_seller_name_idx
  on public.internal_identities (seller_name);
