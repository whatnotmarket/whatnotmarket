-- Fix follows table and notifications

-- 1. Ensure profiles table has the necessary columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- 2. Ensure follows table exists
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 3. Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts and re-create them
DROP POLICY IF EXISTS "Public follows are viewable by everyone." ON public.follows;
DROP POLICY IF EXISTS "Users can see who follows whom" ON public.follows;
CREATE POLICY "Public follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others." ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow." ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
CREATE POLICY "Users can unfollow others" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- 5. Create or Replace Functions for handling follows
-- We need to combine logic from previous migrations: update counts AND send notification

CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name text;
BEGIN
  -- Update counts
  UPDATE public.profiles
  SET following_count = following_count + 1
  WHERE id = NEW.follower_id;

  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE id = NEW.following_id;

  -- Get follower name for notification
  SELECT coalesce(username, full_name, 'Someone') INTO v_follower_name
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Create notification (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      body,
      link,
      metadata
    ) VALUES (
      NEW.following_id,
      NEW.follower_id,
      'new_follower',
      'New Follower',
      format('%s started following you', v_follower_name),
      '/profile/' || NEW.follower_id,
      jsonb_build_object('follower_id', NEW.follower_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_unfollow()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts
  UPDATE public.profiles
  SET following_count = GREATEST(0, following_count - 1)
  WHERE id = OLD.follower_id;

  UPDATE public.profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Re-create Triggers
DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
DROP TRIGGER IF EXISTS on_follow_created ON public.follows;

CREATE TRIGGER on_follow_created
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();

DROP TRIGGER IF EXISTS on_follow_deleted ON public.follows;
CREATE TRIGGER on_follow_deleted
    AFTER DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_unfollow();
