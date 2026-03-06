-- Notifications system for buyer/seller actions in marketplace flow.

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_read_at_idx
  on public.notifications (recipient_id, read_at);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_recipient_or_admin on public.notifications;
drop policy if exists notifications_update_recipient_or_admin on public.notifications;

create policy notifications_select_recipient_or_admin
  on public.notifications for select
  using (
    recipient_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy notifications_update_recipient_or_admin
  on public.notifications for update
  using (
    recipient_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    recipient_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create or replace function public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_id is null then
    return;
  end if;

  if p_actor_id is not null and p_actor_id = p_recipient_id then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    link,
    metadata
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_type,
    p_title,
    p_body,
    p_link,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.notify_offer_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_owner_id uuid;
  v_request_title text;
begin
  select r.created_by, r.title
  into v_request_owner_id, v_request_title
  from public.requests r
  where r.id = new.request_id;

  perform public.create_notification(
    v_request_owner_id,
    new.created_by,
    'offer_created',
    'Nuova offerta ricevuta',
    format('Hai ricevuto una nuova offerta di $%s per "%s".', new.price, coalesce(v_request_title, 'la tua richiesta')),
    '/requests/' || new.request_id,
    jsonb_build_object(
      'offer_id', new.id,
      'request_id', new.request_id,
      'price', new.price
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_offer_created on public.offers;
create trigger trg_notify_offer_created
after insert on public.offers
for each row execute function public.notify_offer_created();

create or replace function public.notify_deal_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_title text;
  v_actor_id uuid;
begin
  select r.title
  into v_request_title
  from public.requests r
  where r.id = new.request_id;

  v_actor_id := coalesce(auth.uid(), new.seller_id);

  perform public.create_notification(
    new.buyer_id,
    v_actor_id,
    'offer_accepted',
    'Offerta accettata',
    format('Il seller ha accettato la tua offerta per "%s". La chat e ora attiva.', coalesce(v_request_title, 'la richiesta')),
    '/deals/' || new.id,
    jsonb_build_object(
      'deal_id', new.id,
      'request_id', new.request_id,
      'offer_id', new.offer_id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_deal_created on public.deals;
create trigger trg_notify_deal_created
after insert on public.deals
for each row execute function public.notify_deal_created();

create or replace function public.notify_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_request_id uuid;
  v_request_title text;
  v_recipient_id uuid;
  v_preview text;
begin
  select d.buyer_id, d.seller_id, d.request_id
  into v_buyer_id, v_seller_id, v_request_id
  from public.deals d
  where d.id = new.deal_id;

  if not found then
    return new;
  end if;

  if new.content = 'Offer accepted. Deal room is now open.' then
    return new;
  end if;

  if new.sender_id = v_buyer_id then
    v_recipient_id := v_seller_id;
  elsif new.sender_id = v_seller_id then
    v_recipient_id := v_buyer_id;
  else
    return new;
  end if;

  select r.title
  into v_request_title
  from public.requests r
  where r.id = v_request_id;

  v_preview := left(new.content, 120);

  perform public.create_notification(
    v_recipient_id,
    new.sender_id,
    'message_received',
    'Nuovo messaggio',
    format('Nuovo messaggio nella trattativa "%s": %s', coalesce(v_request_title, 'Deal'), v_preview),
    '/deals/' || new.deal_id,
    jsonb_build_object(
      'deal_id', new.deal_id,
      'message_id', new.id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_message_created on public.messages;
create trigger trg_notify_message_created
after insert on public.messages
for each row execute function public.notify_message_created();

create or replace function public.notify_deal_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_request_title text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status not in ('completed'::public.deal_status, 'cancelled'::public.deal_status) then
    return new;
  end if;

  select r.title
  into v_request_title
  from public.requests r
  where r.id = new.request_id;

  v_actor_id := auth.uid();

  if v_actor_id = new.buyer_id then
    perform public.create_notification(
      new.seller_id,
      v_actor_id,
      'deal_status_changed',
      'Stato deal aggiornato',
      format('Il buyer ha aggiornato la trattativa "%s" a %s.', coalesce(v_request_title, 'Deal'), new.status),
      '/deals/' || new.id,
      jsonb_build_object('deal_id', new.id, 'status', new.status)
    );
  elsif v_actor_id = new.seller_id then
    perform public.create_notification(
      new.buyer_id,
      v_actor_id,
      'deal_status_changed',
      'Stato deal aggiornato',
      format('Il seller ha aggiornato la trattativa "%s" a %s.', coalesce(v_request_title, 'Deal'), new.status),
      '/deals/' || new.id,
      jsonb_build_object('deal_id', new.id, 'status', new.status)
    );
  else
    perform public.create_notification(
      new.buyer_id,
      v_actor_id,
      'deal_status_changed',
      'Stato deal aggiornato',
      format('La trattativa "%s" e ora %s.', coalesce(v_request_title, 'Deal'), new.status),
      '/deals/' || new.id,
      jsonb_build_object('deal_id', new.id, 'status', new.status)
    );

    perform public.create_notification(
      new.seller_id,
      v_actor_id,
      'deal_status_changed',
      'Stato deal aggiornato',
      format('La trattativa "%s" e ora %s.', coalesce(v_request_title, 'Deal'), new.status),
      '/deals/' || new.id,
      jsonb_build_object('deal_id', new.id, 'status', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_deal_status_changed on public.deals;
create trigger trg_notify_deal_status_changed
after update on public.deals
for each row execute function public.notify_deal_status_changed();

-- Realtime notifications stream.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;

