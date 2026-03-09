-- Enhance deals for direct trade flow with detailed negotiation states

-- 1. Update deal_status enum (idempotent approach)
-- Adding states to support the Buyer -> Seller -> Buyer counter offer loop
DO $$
BEGIN
    -- Existing states from previous migration attempt (re-listing to be safe)
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'negotiating';
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'offer_sent'; -- Usually means initial offer
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'offer_accepted';
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'escrow_funded';
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'shipped';
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'dispute';
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'completed';
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'cancelled';
    
    -- New states for explicit negotiation flow
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'buyer_offer_sent'; -- Explicitly buyer sent
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'seller_counter_offer'; -- Seller countered
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'buyer_counter_offer'; -- Buyer countered back
    ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'offer_rejected';
    
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Relax constraints on deals table to allow direct trades without request/offer
ALTER TABLE public.deals 
ALTER COLUMN request_id DROP NOT NULL,
ALTER COLUMN offer_id DROP NOT NULL;

-- 3. Add trade details directly to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS token_symbol text DEFAULT 'SOL',
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS deal_type text DEFAULT 'request_offer', -- 'request_offer' or 'direct'
ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.profiles(id), -- Who initiated the CURRENT offer/counter-offer
ADD COLUMN IF NOT EXISTS last_action_by uuid REFERENCES public.profiles(id); -- To track whose turn it is (or who acted last)

-- 4. Update chat_messages (already planned, but repeating for completeness in this file context if needed, but previous file was not run yet)
ALTER TABLE public.chat_messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'text'; -- Ensure type exists

-- 5. Add index
CREATE INDEX IF NOT EXISTS idx_chat_messages_deal_id ON public.chat_messages(deal_id);

-- 6. Update RLS for deals to allow both buyer and seller to create deals (offers)
DROP POLICY IF EXISTS deals_insert_buyer_or_admin ON public.deals;
DROP POLICY IF EXISTS deals_insert_participant ON public.deals;

CREATE POLICY deals_insert_participant
  ON public.deals FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- 7. Ensure updates are allowed by participants
DROP POLICY IF EXISTS deals_update_participants_or_admin ON public.deals;
CREATE POLICY deals_update_participants_or_admin
  ON public.deals FOR UPDATE
  USING (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  WITH CHECK (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
