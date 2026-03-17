-- Persist profile media (avatar + banner) in Supabase storage and profile table.

alter table public.profiles
  add column if not exists banner_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-banners',
  'profile-banners',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_banners_select_public on storage.objects;
create policy profile_banners_select_public
  on storage.objects for select
  using (bucket_id = 'profile-banners');

drop policy if exists profile_banners_insert_own_folder on storage.objects;
create policy profile_banners_insert_own_folder
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists profile_banners_update_own_folder on storage.objects;
create policy profile_banners_update_own_folder
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists profile_banners_delete_own_folder on storage.objects;
create policy profile_banners_delete_own_folder
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Optional companion policies for avatars to allow users to manage their own files.
drop policy if exists avatars_update_own_folder on storage.objects;
create policy avatars_update_own_folder
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own_folder on storage.objects;
create policy avatars_delete_own_folder
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
