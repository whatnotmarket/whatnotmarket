-- Enable Realtime for user_blocks table
-- This is required for the Chat UI to receive updates when a user blocks/unblocks another user
-- ensuring the UI updates immediately without page refresh
ALTER PUBLICATION supabase_realtime ADD TABLE user_blocks;
