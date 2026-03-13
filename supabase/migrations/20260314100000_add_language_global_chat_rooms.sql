insert into public.global_chat_rooms (slug, label, description, is_active)
values
  ('english', 'English', 'General English room.', true),
  ('spanish', 'Spanish', 'General Spanish room.', true),
  ('polish', 'Polish', 'General Polish room.', true),
  ('russian', 'Russian', 'General Russian room.', true),
  ('ukrainian', 'Ukrainian', 'General Ukrainian room.', true),
  ('turkish', 'Turkish', 'General Turkish room.', true),
  ('romanian', 'Romanian', 'General Romanian room.', true),
  ('portuguese-br', 'Portuguese (Brazil)', 'General Brazilian Portuguese room.', true)
on conflict (slug) do update
set label = excluded.label,
    description = excluded.description,
    is_active = excluded.is_active;

insert into public.global_chat_room_state (room_slug, slow_mode_seconds, closed_until)
values
  ('english', 0, null),
  ('spanish', 0, null),
  ('polish', 0, null),
  ('russian', 0, null),
  ('ukrainian', 0, null),
  ('turkish', 0, null),
  ('romanian', 0, null),
  ('portuguese-br', 0, null)
on conflict (room_slug) do nothing;
