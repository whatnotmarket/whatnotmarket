-- Prevent profile handle impersonation of official/support identities.

create or replace function public.block_reserved_profile_usernames()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text;
  actor_id uuid := auth.uid();
  actor_is_admin boolean := false;
  is_reserved boolean := false;
begin
  normalized_username := lower(regexp_replace(coalesce(new.username, ''), '^@+', ''));

  if normalized_username = '' then
    return new;
  end if;

  is_reserved := normalized_username = any(array[
    'admin',
    'administrator',
    'support',
    'helpdesk',
    'moderator',
    'mod',
    'staff',
    'security',
    'official',
    'team',
    'whatnotmarket'
  ]);

  if not is_reserved then
    return new;
  end if;

  if actor_id is not null then
    select exists(
      select 1
      from public.profiles p
      where p.id = actor_id
        and p.is_admin = true
    )
    into actor_is_admin;
  end if;

  if coalesce(new.is_admin, false) = true or actor_is_admin = true then
    return new;
  end if;

  raise exception 'Reserved username is restricted';
end;
$$;

drop trigger if exists trg_block_reserved_profile_usernames on public.profiles;
create trigger trg_block_reserved_profile_usernames
before insert or update of username, is_admin on public.profiles
for each row
execute function public.block_reserved_profile_usernames();
