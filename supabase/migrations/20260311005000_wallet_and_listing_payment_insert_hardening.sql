-- Harden wallet and listing payment inserts against direct client spoofing.

-- Wallet writes must be backend-controlled (service role) or canonical admins only.
drop policy if exists wallets_insert_owner on public.wallets;
drop policy if exists wallets_insert_admin on public.wallets;
create policy wallets_insert_admin
  on public.wallets
  for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
    )
  );

create or replace function public.enforce_wallet_write_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean := false;
begin
  -- Service role writes run with null auth.uid(); keep backend flows working.
  if actor_id is null then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = actor_id
      and p.is_admin = true
  )
  into actor_is_admin;

  if not actor_is_admin then
    raise exception 'wallet_mutations_require_admin';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_wallet_write_guard on public.wallets;
create trigger trg_enforce_wallet_write_guard
before insert or update on public.wallets
for each row execute function public.enforce_wallet_write_guard();

-- Listing payment inserts must stay pending + wallet-bound + non-self-directed.
drop policy if exists listing_payments_insert_payer on public.listing_payments;
create policy listing_payments_insert_payer
  on public.listing_payments
  for insert
  with check (
    payer_user_id = auth.uid()
    and status = 'pending'::public.listing_payment_status
    and tx_hash_in is null
    and tx_hash_out is null
    and payee_user_id is not null
    and payee_user_id <> auth.uid()
  );

create or replace function public.enforce_listing_payment_insert_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean := false;
begin
  if new.status <> 'pending'::public.listing_payment_status then
    raise exception 'listing_payment_insert_status_must_be_pending';
  end if;

  if new.tx_hash_in is not null or new.tx_hash_out is not null then
    raise exception 'listing_payment_insert_hashes_must_be_null';
  end if;

  if new.payer_user_id is null or new.payee_user_id is null then
    raise exception 'listing_payment_insert_missing_participants';
  end if;

  if new.payer_user_id = new.payee_user_id then
    raise exception 'listing_payment_insert_self_payment_forbidden';
  end if;

  if lower(coalesce(new.payer_wallet_address, '')) = lower(coalesce(new.target_wallet_address, '')) then
    raise exception 'listing_payment_insert_wallets_must_differ';
  end if;

  if coalesce(trim(new.idempotency_key), '') = '' then
    raise exception 'listing_payment_insert_idempotency_required';
  end if;

  if not exists (
    select 1
    from public.wallets w
    where w.user_id = new.payer_user_id
      and lower(w.address) = lower(new.payer_wallet_address)
      and lower(w.chain) = lower(new.chain)
      and w.verified_at is not null
  ) then
    raise exception 'listing_payment_insert_invalid_payer_wallet';
  end if;

  if not exists (
    select 1
    from public.wallets w
    where w.user_id = new.payee_user_id
      and lower(w.address) = lower(new.target_wallet_address)
      and lower(w.chain) = lower(new.chain)
      and w.verified_at is not null
  ) then
    raise exception 'listing_payment_insert_invalid_payee_wallet';
  end if;

  if actor_id is null then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = actor_id
      and p.is_admin = true
  )
  into actor_is_admin;

  if not actor_is_admin and actor_id <> new.payer_user_id then
    raise exception 'listing_payment_insert_only_payer_allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_listing_payment_insert_guard on public.listing_payments;
create trigger trg_enforce_listing_payment_insert_guard
before insert on public.listing_payments
for each row execute function public.enforce_listing_payment_insert_guard();
