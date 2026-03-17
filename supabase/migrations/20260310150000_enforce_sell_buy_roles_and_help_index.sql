create or replace function public.enforce_sell_buy_room_roles()
returns trigger
language plpgsql
as $$
declare
  v_role_pref text;
  v_seller_status text;
  v_is_seller boolean;
  v_is_buyer boolean;
begin
  if new.room not in ('sell-services','buy-services') then
    return new;
  end if;

  select role_preference, seller_status
    into v_role_pref, v_seller_status
  from public.profiles
  where id = new.user_id;

  v_is_seller := (v_role_pref = 'seller') or (v_role_pref = 'both') or (v_seller_status = 'verified');
  v_is_buyer  := (v_role_pref = 'buyer') or (v_role_pref = 'both') or (not v_is_seller);

  if new.reply_to_id is null then
    if new.room = 'sell-services' and not v_is_seller then
      raise exception 'ROLE_NOT_ALLOWED: Only sellers can start threads in Sell Services.' using errcode = 'P0001';
    end if;
    if new.room = 'buy-services' and not v_is_buyer then
      raise exception 'ROLE_NOT_ALLOWED: Only buyers can start threads in Buy Services.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_sell_buy_room_roles on public.global_chat_messages;

create trigger trg_enforce_sell_buy_room_roles
before insert on public.global_chat_messages
for each row execute function public.enforce_sell_buy_room_roles();

create index if not exists idx_gcm_help_top_level_user_created
  on public.global_chat_messages (user_id, created_at desc)
  where room = 'help' and reply_to_id is null;

alter table public.global_chat_user_controls
  add column if not exists is_moderator boolean not null default false;

alter table public.global_chat_user_controls
  add column if not exists moderator_override boolean not null default false;
