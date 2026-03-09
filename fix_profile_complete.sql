-- 1. Ensure all columns exist in 'profiles'
DO $$
BEGIN
    -- banner_position
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banner_position') THEN
        ALTER TABLE public.profiles ADD COLUMN banner_position integer DEFAULT 50;
    END IF;

    -- bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;

    -- banner_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banner_url') THEN
        ALTER TABLE public.profiles ADD COLUMN banner_url text;
    END IF;

    -- telegram_handle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'telegram_handle') THEN
        ALTER TABLE public.profiles ADD COLUMN telegram_handle text;
    END IF;

    -- twitter_handle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'twitter_handle') THEN
        ALTER TABLE public.profiles ADD COLUMN twitter_handle text;
    END IF;

    -- website
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE public.profiles ADD COLUMN website text;
    END IF;

    -- updated_at (CRITICAL FIX)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Create Buckets (Safe Insert)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banners', 'banners', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 3. Storage Policies (Drop & Recreate to be sure)
-- Avatars
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Banners
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON storage.objects;
CREATE POLICY "Public banners are viewable by everyone" ON storage.objects FOR SELECT USING ( bucket_id = 'banners' );

DROP POLICY IF EXISTS "Users can upload their own banner" ON storage.objects;
CREATE POLICY "Users can upload their own banner" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "Users can update their own banner" ON storage.objects;
CREATE POLICY "Users can update their own banner" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 4. Profile RLS (Ensure update is allowed)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Grant permissions just in case
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
