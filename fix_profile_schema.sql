-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS banner_position integer DEFAULT 50;

-- 2. Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Set up RLS policies for storage buckets
-- Avatars
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
CREATE POLICY "Public avatars are viewable by everyone"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Banners
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON storage.objects;
CREATE POLICY "Public banners are viewable by everyone"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'banners' );

DROP POLICY IF EXISTS "Users can upload their own banner" ON storage.objects;
CREATE POLICY "Users can upload their own banner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "Users can update their own banner" ON storage.objects;
CREATE POLICY "Users can update their own banner"
  ON storage.objects FOR UPDATE TO authenticated
  USING ( bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text );
