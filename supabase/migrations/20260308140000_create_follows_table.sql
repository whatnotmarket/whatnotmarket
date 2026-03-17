-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows
CREATE POLICY "Users can see who follows whom" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Add follower/following counts to profiles if not exists (usually computed or cached)
-- For this implementation we will count them dynamically or use existing columns if present

-- Trigger to create notification on follow
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name text;
BEGIN
  -- Get follower name
  SELECT coalesce(username, full_name, 'Someone') INTO v_follower_name
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Create notification
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
    '/profile/' || NEW.follower_id, -- Link to follower profile
    jsonb_build_object('follower_id', NEW.follower_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();
