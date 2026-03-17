-- Open chat only after seller accepts buyer's offer.
-- Convention in this flow:
-- - seller = owner of the request
-- - buyer = creator of the offer

create or replace function public.accept_offer_and_open_chat(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_seller_id uuid;
  v_buyer_id uuid;
  v_existing_deal_id uuid;
  v_deal_id uuid;
begin
  select
    o.request_id,
    r.created_by,
    o.created_by
  into
    v_request_id,
    v_seller_id,
    v_buyer_id
  from public.offers o
  join public.requests r on r.id = o.request_id
  where o.id = p_offer_id
  for update of r, o;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if auth.uid() is distinct from v_seller_id then
    raise exception 'only_seller_can_accept';
  end if;

  select d.id
  into v_existing_deal_id
  from public.deals d
  where d.request_id = v_request_id
  limit 1;

  if v_existing_deal_id is not null then
    return v_existing_deal_id;
  end if;

  update public.offers
  set status = 'accepted'::public.offer_status
  where id = p_offer_id;

  update public.offers
  set status = 'rejected'::public.offer_status
  where request_id = v_request_id
    and id <> p_offer_id
    and status = 'pending'::public.offer_status;

  update public.requests
  set status = 'accepted'::public.request_status
  where id = v_request_id;

  insert into public.deals (request_id, offer_id, buyer_id, seller_id, status)
  values (
    v_request_id,
    p_offer_id,
    v_buyer_id,
    v_seller_id,
    'verification'::public.deal_status
  )
  returning id into v_deal_id;

  -- Seed the conversation so participants see chat activation immediately.
  insert into public.messages (deal_id, sender_id, content)
  values (v_deal_id, v_seller_id, 'Offer accepted. Deal room is now open.');

  return v_deal_id;
end;
$$;

grant execute on function public.accept_offer_and_open_chat(uuid) to authenticated;
