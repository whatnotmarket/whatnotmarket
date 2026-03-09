-- Migration to update user_reports table with new fields
-- Date: 2026-03-09

-- Add new columns to public.user_reports
ALTER TABLE public.user_reports 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS has_proof BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proof_urls TEXT[]; -- Array of URLs for multiple uploaded files

-- Update RLS policies (optional, but ensure they cover new columns)
-- The existing INSERT policy already covers all columns via WITH CHECK (auth.uid() = reporter_id)
-- The existing SELECT policy for admins and reporter already covers all columns

COMMENT ON COLUMN public.user_reports.category IS 'Category of the report (scam, fake_nft, etc.)';
COMMENT ON COLUMN public.user_reports.wallet_address IS 'Reported wallet address';
COMMENT ON COLUMN public.user_reports.tx_hash IS 'Reported transaction hash';
COMMENT ON COLUMN public.user_reports.has_proof IS 'Whether the user provided proof (file/screenshot)';
COMMENT ON COLUMN public.user_reports.proof_urls IS 'Array of storage URLs for the uploaded proofs';
