-- Enable Realtime for chat_messages table
-- This is required for the Inbox to receive updates when new messages are inserted
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
