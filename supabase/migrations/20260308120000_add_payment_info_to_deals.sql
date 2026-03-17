-- Add payment information to deals table
-- This supports the new "New Offer" flow which allows choosing between Crypto and Fiat

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'crypto', -- 'crypto' or 'fiat'
ADD COLUMN IF NOT EXISTS fiat_method text; -- e.g. 'credit_card', 'apple_pay', etc.
