-- Rename table if exists or create new one with correct name
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Copy website') THEN
    ALTER TABLE "Copy website" RENAME TO "copy_website";
  END IF;
END $$;

-- Ensure table exists with correct schema if it wasn't renamed
CREATE TABLE IF NOT EXISTS copy_website (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  content TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('plain', 'textarea', 'title', 'button', 'meta_title', 'meta_description')),
  locale TEXT NOT NULL DEFAULT 'it',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page, section, key, locale)
);

-- RLS
ALTER TABLE copy_website ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (to avoid conflicts/duplication)
DROP POLICY IF EXISTS "Public read access" ON copy_website;
DROP POLICY IF EXISTS "Admins can insert copy" ON copy_website;
DROP POLICY IF EXISTS "Admins can update copy" ON copy_website;
DROP POLICY IF EXISTS "Admins can delete copy" ON copy_website;

-- Re-create Policies
CREATE POLICY "Public read access" ON copy_website FOR SELECT USING (true);

CREATE POLICY "Admins can insert copy" ON copy_website FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can update copy" ON copy_website FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can delete copy" ON copy_website FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Seed Data
INSERT INTO copy_website (page, section, key, label, content, content_type, locale)
VALUES
  -- Market Hero
  ('/market', 'hero', 'badge_1', 'Badge 1', 'Zero-Knowledge', 'plain', 'it'),
  ('/market', 'hero', 'badge_2', 'Badge 2', 'No Logs', 'plain', 'it'),
  ('/market', 'hero', 'badge_3', 'Badge 3', '100% Anonymous', 'plain', 'it'),
  ('/market', 'hero', 'title', 'Main Title', 'Il marketplace privato dove trovi quello che cerchi', 'title', 'it'),
  ('/market', 'hero', 'subtitle', 'Subtitle', 'Cerca richieste, ricevi offerte verificate e chiudi il deal in escrow in modo sicuro.', 'textarea', 'it'),

  -- How It Works
  ('/market', 'how_it_works', 'title', 'Section Title', 'Come funziona Whatnot Market', 'title', 'it'),
  ('/market', 'how_it_works', 'subtitle', 'Section Subtitle', 'Il modo più sicuro per comprare e vendere prodotti esclusivi con criptovalute.', 'plain', 'it'),
  ('/market', 'how_it_works', 'step_1_title', 'Step 1 Title', '1. Fai una Richiesta', 'plain', 'it'),
  ('/market', 'how_it_works', 'step_1_desc', 'Step 1 Description', 'Descrivi ciò che cerchi. I venditori verificati riceveranno una notifica.', 'textarea', 'it'),
  ('/market', 'how_it_works', 'step_2_title', 'Step 2 Title', '2. Ricevi Offerte', 'plain', 'it'),
  ('/market', 'how_it_works', 'step_2_desc', 'Step 2 Description', 'Confronta prezzi e condizioni. Chatta con i venditori in tempo reale.', 'textarea', 'it'),
  ('/market', 'how_it_works', 'step_3_title', 'Step 3 Title', '3. Chiudi il Deal', 'plain', 'it'),
  ('/market', 'how_it_works', 'step_3_desc', 'Step 3 Description', 'Paga in crypto tramite Escrow. I fondi vengono rilasciati solo quando sei soddisfatto.', 'textarea', 'it'),

  -- Trust CTA
  ('/market', 'trust_cta', 'verified_title', 'Verified Title', 'Venditori Verificati', 'title', 'it'),
  ('/market', 'trust_cta', 'verified_desc', 'Verified Description', 'Ogni venditore passa attraverso un processo di verifica rigoroso via Telegram e KYC opzionale.', 'textarea', 'it'),
  ('/market', 'trust_cta', 'verified_btn', 'Verified Button', 'Diventa Venditore', 'button', 'it'),
  ('/market', 'trust_cta', 'escrow_title', 'Escrow Title', 'Escrow Sicuro', 'title', 'it'),
  ('/market', 'trust_cta', 'escrow_desc', 'Escrow Description', 'I tuoi fondi sono al sicuro nel nostro smart contract fino alla consegna del prodotto.', 'textarea', 'it'),
  ('/market', 'trust_cta', 'escrow_btn', 'Escrow Button', 'Scopri di più', 'button', 'it'),
  ('/market', 'trust_cta', 'affiliate_title', 'Affiliate Title', 'Become Affiliate', 'title', 'it'),
  ('/market', 'trust_cta', 'affiliate_desc', 'Affiliate Description', 'Guadagna commissioni invitando nuovi utenti. Ricevi fino al 20% sulle fee di ogni transazione generata dai tuoi referral.', 'textarea', 'it'),
  ('/market', 'trust_cta', 'affiliate_btn', 'Affiliate Button', 'Join Program', 'button', 'it'),

  -- Buy Anywhere (Market Page)
  ('/market', 'buy_anywhere', 'badge', 'Badge', 'NEW FEATURE', 'plain', 'it'),
  ('/market', 'buy_anywhere', 'title', 'Title', 'Buy Anywhere with Crypto', 'title', 'it'),
  ('/market', 'buy_anywhere', 'desc', 'Description', 'Find something outside the marketplace? Paste any product link and we''ll purchase it for you using crypto — privately and securely.', 'textarea', 'it'),
  ('/market', 'buy_anywhere', 'btn', 'Button Label', 'Start Proxy Order', 'button', 'it'),
  ('/market', 'buy_anywhere', 'expanded_title', 'Expanded Title', 'Buy Anywhere', 'title', 'it'),
  ('/market', 'buy_anywhere', 'close_btn', 'Close Button', 'Close', 'button', 'it')
ON CONFLICT (page, section, key, locale) 
DO UPDATE SET 
  content = EXCLUDED.content,
  label = EXCLUDED.label,
  content_type = EXCLUDED.content_type;
