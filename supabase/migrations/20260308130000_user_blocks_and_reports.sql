-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for user_blocks
CREATE POLICY "Users can see blocks they are involved in" ON public.user_blocks
    FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block others" ON public.user_blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" ON public.user_blocks
    FOR DELETE USING (auth.uid() = blocker_id);

-- Create user_reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Policies for user_reports
CREATE POLICY "Users can create reports" ON public.user_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports" ON public.user_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
        OR auth.uid() = reporter_id
    );

-- Notify admin function (optional hook into existing notification system)
CREATE OR REPLACE FUNCTION public.handle_new_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for admins (assuming create_notification function exists)
    -- This part depends on existing notification logic, keeping it simple for now
    -- We could notify specific admins or just log it
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_report
    AFTER INSERT ON public.user_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_report();
