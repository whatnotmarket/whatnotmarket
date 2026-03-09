-- 1. Ensure 'type' column exists and has correct constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invite_codes' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.invite_codes ADD COLUMN type text NOT NULL DEFAULT 'buyer';
        ALTER TABLE public.invite_codes ALTER COLUMN type DROP DEFAULT;
        ALTER TABLE public.invite_codes ADD CONSTRAINT invite_codes_type_check CHECK (type IN ('buyer', 'seller', 'founder'));
    END IF;
END $$;

-- 2. Insert or Update 'LUCA' code
INSERT INTO public.invite_codes (
  code,
  type,
  status,
  single_use,
  usage_limit,
  notes
) VALUES (
  'LUCA',
  'buyer',
  'active',
  false,
  1000,
  'Codice buyer di test per Luca'
)
ON CONFLICT (code) DO UPDATE SET
  type = 'buyer',
  status = 'active',
  usage_limit = 1000,
  notes = 'Codice buyer di test riattivato';
