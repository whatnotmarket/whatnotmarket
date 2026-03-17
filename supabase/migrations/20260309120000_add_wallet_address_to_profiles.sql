-- Add wallet_address to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_address text;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);

-- Function to sync wallet address from wallets table if needed
CREATE OR REPLACE FUNCTION public.sync_latest_wallet_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET wallet_address = NEW.address
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update profile when a wallet is added/verified
DROP TRIGGER IF EXISTS on_wallet_verified ON public.wallets;
CREATE TRIGGER on_wallet_verified
AFTER INSERT OR UPDATE ON public.wallets
FOR EACH ROW
WHEN (NEW.verified_at IS NOT NULL)
EXECUTE FUNCTION public.sync_latest_wallet_to_profile();
