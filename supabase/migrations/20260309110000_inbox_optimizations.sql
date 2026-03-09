-- Migration to handle read receipts and performance for inbox
-- Date: 2026-03-09

-- 1. Function to mark all messages in a room as read for a specific user
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_room_id TEXT, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.chat_messages
    SET is_read = TRUE
    WHERE room_id = p_room_id
      AND sender_id != p_user_id
      AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Optimize unread count queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread 
ON public.chat_messages (room_id, sender_id) 
WHERE is_read = FALSE;

-- 3. Ensure deal_status enum is comprehensive (optional but recommended based on TradePanel)
-- Note: If the enum already exists, we might need to add values individually
DO $$
BEGIN
    -- Try to add new statuses to the enum if they don't exist
    -- This depends on how your Supabase environment handles ALTER TYPE
    -- If it fails, we'll handle it manually in the dashboard
    ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'offer_sent';
    ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'offer_accepted';
    ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'offer_rejected';
    ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'shipped';
    ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'dispute';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
