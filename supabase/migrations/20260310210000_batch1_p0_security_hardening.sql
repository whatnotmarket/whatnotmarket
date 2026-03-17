-- Batch 1 (P0) security hardening:
-- - Protect sensitive profile fields from self-escalation
-- - Lock down admin password verification function execution
-- - Remove weak default admin secret if still present
-- - Persist tx hash binding on orders to prevent replay across orders

create extension if not exists pgcrypto;

create or replace function public.block_sensitive_profile_self_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean := false;
begin
  if actor_id is null then
    return new;
  end if;

  select exists(
    select 1
    from public.profiles p
    where p.id = actor_id
      and p.is_admin = true
  )
  into actor_is_admin;

  if actor_is_admin = false and actor_id = new.id then
    if tg_op = 'INSERT' then
      if coalesce(new.is_admin, false) = true
        or coalesce(new.seller_status, 'unverified') = 'verified'
        or coalesce(new.account_status, 'active') <> 'active'
        or new.session_force_logout_at is not null
        or new.telegram_user_id is not null
        or new.telegram_username is not null then
        raise exception 'Sensitive profile fields cannot be self-set on insert';
      end if;
      return new;
    end if;

    if new.is_admin is distinct from old.is_admin
      or new.seller_status is distinct from old.seller_status
      or new.account_status is distinct from old.account_status
      or new.session_force_logout_at is distinct from old.session_force_logout_at
      or new.telegram_user_id is distinct from old.telegram_user_id
      or new.telegram_username is distinct from old.telegram_username then
      raise exception 'Sensitive profile fields cannot be self-updated';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_block_sensitive_profile_self_updates on public.profiles;
create trigger trg_block_sensitive_profile_self_updates
before insert or update on public.profiles
for each row
execute function public.block_sensitive_profile_self_updates();

-- verify_admin_password should only be callable by trusted backend contexts.
revoke all on function public.verify_admin_password(text) from public;
revoke execute on function public.verify_admin_password(text) from anon, authenticated;
grant execute on function public.verify_admin_password(text) to service_role;

-- If bootstrap default secret is still present, rotate immediately to a random value.
do $$
begin
  if exists (
    select 1
    from public.admin_password
    where id = 1
      and extensions.crypt('CHANGE_ME_ADMIN_PASSWORD', secret_hash) = secret_hash
  ) then
    update public.admin_password
    set secret_hash = extensions.crypt(
      encode(extensions.gen_random_bytes(32), 'hex'),
      extensions.gen_salt('bf', 12)
    ),
    updated_at = now()
    where id = 1;
  end if;
end $$;

alter table public.proxy_orders
  add column if not exists payment_tx_hash text,
  add column if not exists payment_verified_at timestamptz;

create unique index if not exists proxy_orders_payment_tx_hash_key
  on public.proxy_orders (payment_tx_hash)
  where payment_tx_hash is not null;
