-- Add is_deleted column to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Create function to soft delete messages in a room
CREATE OR REPLACE FUNCTION public.soft_delete_room_messages(target_room_id text)
RETURNS void AS $$
BEGIN
  UPDATE public.chat_messages
  SET is_deleted = true
  WHERE room_id = target_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
