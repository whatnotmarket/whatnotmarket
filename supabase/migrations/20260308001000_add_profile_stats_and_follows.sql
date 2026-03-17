-- Add missing stats columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS response_time_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_rate numeric DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchases_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS buyer_ranking text DEFAULT 'Rookie Buyer',
ADD COLUMN IF NOT EXISTS protection_level text DEFAULT 'Maximum Coverage';

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows
DROP POLICY IF EXISTS "Public follows are viewable by everyone." ON public.follows;
CREATE POLICY "Public follows are viewable by everyone."
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others." ON public.follows;
CREATE POLICY "Users can follow others."
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow." ON public.follows;
CREATE POLICY "Users can unfollow."
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Functions to auto-update counts
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET following_count = following_count + 1
  WHERE id = NEW.follower_id;

  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE id = NEW.following_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_unfollow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET following_count = following_count - 1
  WHERE id = OLD.follower_id;

  UPDATE public.profiles
  SET followers_count = followers_count - 1
  WHERE id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();

DROP TRIGGER IF EXISTS on_follow_deleted ON public.follows;
CREATE TRIGGER on_follow_deleted
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_unfollow();
