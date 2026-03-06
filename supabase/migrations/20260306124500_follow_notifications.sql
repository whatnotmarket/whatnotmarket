-- Notify users when they receive a new follow.

create or replace function public.notify_profile_follow_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
begin
  select coalesce(
    nullif(p.username, ''),
    nullif(p.full_name, ''),
    'Un utente'
  )
  into v_actor_name
  from public.profiles p
  where p.id = new.follower_id;

  perform public.create_notification(
    new.following_id,
    new.follower_id,
    'profile_followed',
    'Nuovo follower',
    format('%s ha iniziato a seguirti.', v_actor_name),
    '/profile/' || new.follower_id,
    jsonb_build_object(
      'follower_id', new.follower_id,
      'following_id', new.following_id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_profile_follow_created on public.profile_follows;
create trigger trg_notify_profile_follow_created
after insert on public.profile_follows
for each row execute function public.notify_profile_follow_created();
