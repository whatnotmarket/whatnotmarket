-- Batch 2 (P1) security hardening
-- - F-004: Deal lifecycle must be server-authoritative
-- - F-005: Chat spoofing/phishing hardening
-- - F-008: SECURITY DEFINER grant/check hardening
-- - F-015: Restrict permissive wallet/listing payment updates

create extension if not exists pgcrypto;

create or replace function public.room_contains_user(p_room_id text, p_user_id uuid)
returns boolean
language plpgsql
immutable
as $$
declare
  left_part text;
  right_part text;
begin
  if p_room_id is null or p_user_id is null then
    return false;
  end if;

  if p_room_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  left_part := split_part(p_room_id, '_', 1);
  right_part := split_part(p_room_id, '_', 2);

  return left_part = p_user_id::text or right_part = p_user_id::text;
end;
$$;

drop policy if exists "Users can view messages in their rooms" on public.chat_messages;
drop policy if exists "Users can insert messages in their rooms" on public.chat_messages;
drop policy if exists "Users can update messages in their rooms" on public.chat_messages;
drop policy if exists chat_messages_select_participants on public.chat_messages;
drop policy if exists chat_messages_insert_sender on public.chat_messages;
drop policy if exists chat_messages_update_sender_only on public.chat_messages;

create policy chat_messages_select_participants
  on public.chat_messages for select
  using (public.room_contains_user(room_id, auth.uid()));

create policy chat_messages_insert_sender
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and public.room_contains_user(room_id, auth.uid())
  );

create policy chat_messages_update_sender_only
  on public.chat_messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create or replace function public.enforce_chat_message_guardrails()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.room_contains_user(new.room_id, new.sender_id) then
    raise exception 'invalid_room_membership';
  end if;

  if char_length(coalesce(new.content, '')) = 0 or char_length(new.content) > 2000 then
    raise exception 'invalid_chat_content_length';
  end if;

  if coalesce(new.type, 'text') in ('text', 'system')
     and new.content ~* '((https?://|www\.)\S+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/\S*)' then
    raise exception 'chat_links_not_allowed';
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null and auth.uid() <> new.sender_id then
      raise exception 'sender_mismatch';
    end if;
    return new;
  end if;

  if new.room_id is distinct from old.room_id
     or new.sender_id is distinct from old.sender_id
     or new.content is distinct from old.content
     or coalesce(new.type, 'text') is distinct from coalesce(old.type, 'text')
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable_chat_fields';
  end if;

  if auth.uid() is not null and auth.uid() <> old.sender_id then
    if not public.room_contains_user(old.room_id, auth.uid()) then
      raise exception 'forbidden_chat_update';
    end if;

    if new.metadata is distinct from old.metadata then
      raise exception 'non_sender_cannot_edit_metadata';
    end if;
  end if;

  if old.is_read = true and new.is_read = false then
    raise exception 'cannot_unread_message';
  end if;

  if old.is_deleted = true and new.is_deleted = false then
    raise exception 'cannot_restore_deleted_message';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_chat_message_guardrails on public.chat_messages;
create trigger trg_enforce_chat_message_guardrails
before insert or update on public.chat_messages
for each row execute function public.enforce_chat_message_guardrails();

create or replace function public.soft_delete_room_messages(target_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.room_contains_user(target_room_id, auth.uid()) then
    raise exception 'forbidden';
  end if;

  update public.chat_messages
  set is_deleted = true
  where room_id = target_room_id;
end;
$$;

create or replace function public.mark_messages_as_read(p_room_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  if not public.room_contains_user(p_room_id, auth.uid()) then
    raise exception 'forbidden_room';
  end if;

  update public.chat_messages
  set is_read = true
  where room_id = p_room_id
    and sender_id <> p_user_id
    and is_read = false;
end;
$$;

revoke all on function public.soft_delete_room_messages(text) from public, anon;
grant execute on function public.soft_delete_room_messages(text) to authenticated, service_role;

revoke all on function public.mark_messages_as_read(text, uuid) from public, anon;
grant execute on function public.mark_messages_as_read(text, uuid) to authenticated, service_role;

revoke all on function public.create_notification(uuid, uuid, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_notification(uuid, uuid, text, text, text, text, jsonb)
  to service_role;

drop policy if exists deals_insert_buyer_or_admin on public.deals;
drop policy if exists deals_insert_participant on public.deals;
drop policy if exists deals_update_participants_or_admin on public.deals;
drop policy if exists deals_insert_admin_only on public.deals;
drop policy if exists deals_update_admin_only on public.deals;

create policy deals_insert_admin_only
  on public.deals for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy deals_update_admin_only
  on public.deals for update
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

drop policy if exists wallets_update_owner on public.wallets;
drop policy if exists wallets_update_admin on public.wallets;

create policy wallets_update_admin
  on public.wallets for update
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

drop policy if exists listing_payments_payer_cancel on public.listing_payments;
drop policy if exists listing_payments_payer_limited_update on public.listing_payments;

create policy listing_payments_payer_limited_update
  on public.listing_payments for update
  using (
    payer_user_id = auth.uid()
    and status = 'pending'::public.listing_payment_status
  )
  with check (
    payer_user_id = auth.uid()
    and status in ('pending'::public.listing_payment_status, 'cancelled'::public.listing_payment_status)
  );

create or replace function public.enforce_listing_payment_update_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_is_admin boolean := false;
begin
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  ) into v_is_admin;

  if v_is_admin then
    return new;
  end if;

  if auth.uid() <> old.payer_user_id then
    raise exception 'only_payer_can_mutate_listing_payment';
  end if;

  if new.listing_id is distinct from old.listing_id
     or new.payer_user_id is distinct from old.payer_user_id
     or new.payee_user_id is distinct from old.payee_user_id
     or lower(new.payer_wallet_address) is distinct from lower(old.payer_wallet_address)
     or lower(new.target_wallet_address) is distinct from lower(old.target_wallet_address)
     or new.amount is distinct from old.amount
     or upper(new.currency) is distinct from upper(old.currency)
     or lower(new.chain) is distinct from lower(old.chain)
     or new.escrow_reference is distinct from old.escrow_reference
     or new.tx_hash_out is distinct from old.tx_hash_out
     or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'immutable_listing_payment_fields';
  end if;

  if old.status = 'pending'::public.listing_payment_status
     and new.status = 'pending'::public.listing_payment_status then
    if old.tx_hash_in is null and new.tx_hash_in is not null then
      return new;
    end if;

    if new.tx_hash_in is not distinct from old.tx_hash_in then
      return new;
    end if;
  end if;

  if old.status = 'pending'::public.listing_payment_status
     and new.status = 'cancelled'::public.listing_payment_status
     and new.tx_hash_in is not distinct from old.tx_hash_in then
    return new;
  end if;

  raise exception 'invalid_listing_payment_update';
end;
$$;

drop trigger if exists trg_enforce_listing_payment_update_guard on public.listing_payments;
create trigger trg_enforce_listing_payment_update_guard
before update on public.listing_payments
for each row execute function public.enforce_listing_payment_update_guard();

alter table public.proxy_orders
  add column if not exists tracking_access_token text;

update public.proxy_orders
set tracking_access_token = regexp_replace(
  replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'),
  '=+$',
  ''
)
where tracking_access_token is null;

alter table public.proxy_orders
  alter column tracking_access_token set not null;

create unique index if not exists proxy_orders_tracking_access_token_key
  on public.proxy_orders (tracking_access_token);
