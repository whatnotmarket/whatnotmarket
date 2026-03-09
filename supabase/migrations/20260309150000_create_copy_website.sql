-- Create Copy website table
CREATE TABLE IF NOT EXISTS "Copy website" (
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
ALTER TABLE "Copy website" ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY "Public read access"
  ON "Copy website"
  FOR SELECT
  USING (true);

-- Policy: Admin write access
CREATE POLICY "Admins can insert copy"
  ON "Copy website"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update copy"
  ON "Copy website"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete copy"
  ON "Copy website"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
