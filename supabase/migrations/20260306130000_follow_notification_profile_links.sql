-- Use canonical profile URLs for follow notifications.

create or replace function public.notify_profile_follow_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
  v_actor_username text;
  v_actor_role text;
  v_link text;
begin
  select
    coalesce(
      nullif(p.username, ''),
      nullif(p.full_name, ''),
      'Un utente'
    ),
    nullif(p.username, ''),
    p.role_preference
  into v_actor_name, v_actor_username, v_actor_role
  from public.profiles p
  where p.id = new.follower_id;

  if v_actor_username is not null then
    if v_actor_role = 'buyer' then
      v_link := '/buyer/@' || v_actor_username;
    else
      v_link := '/seller/@' || v_actor_username;
    end if;
  else
    v_link := '/profile/' || new.follower_id;
  end if;

  perform public.create_notification(
    new.following_id,
    new.follower_id,
    'profile_followed',
    'Nuovo follower',
    format('%s ha iniziato a seguirti.', v_actor_name),
    v_link,
    jsonb_build_object(
      'follower_id', new.follower_id,
      'following_id', new.following_id
    )
  );

  return new;
end;
$$;
