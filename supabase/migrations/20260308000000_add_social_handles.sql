-- Add social handle columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS telegram_handle text,
ADD COLUMN IF NOT EXISTS website text;
