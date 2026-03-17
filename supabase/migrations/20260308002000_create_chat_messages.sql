-- Create chat_messages table for persistent storage
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id text NOT NULL,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    type text DEFAULT 'text', -- 'text', 'audio', etc.
    metadata jsonb DEFAULT '{}'::jsonb, -- stores reactions, audioUrl, etc.
    is_read boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view messages in rooms they are part of (room_id contains their UUID)
CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages FOR SELECT
  USING (room_id LIKE '%' || auth.uid()::text || '%');

-- Users can insert messages in rooms they are part of
CREATE POLICY "Users can insert messages in their rooms"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    room_id LIKE '%' || auth.uid()::text || '%' 
    AND auth.uid() = sender_id
  );

-- Users can update messages (e.g. read status, reactions) in their rooms
CREATE POLICY "Users can update messages in their rooms"
  ON public.chat_messages FOR UPDATE
  USING (room_id LIKE '%' || auth.uid()::text || '%');
