-- Fix RLS policies to ensure Seller can SEE and UPDATE deals
-- Previous policies might have been restrictive on SELECT or UPDATE for the non-creator

-- 1. Ensure SELECT policy allows both participants
DROP POLICY IF EXISTS deals_select_participants_or_admin ON public.deals;
CREATE POLICY deals_select_participants_or_admin
  ON public.deals FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      buyer_id = auth.uid() 
      OR seller_id = auth.uid()
      OR exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin = true
      )
    )
  );

-- 2. Ensure INSERT policy allows creating deals where you are EITHER buyer OR seller
-- (Already done, but reinforcing)
DROP POLICY IF EXISTS deals_insert_participant ON public.deals;
CREATE POLICY deals_insert_participant
  ON public.deals FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- 3. Ensure UPDATE policy is permissive enough for the flow
-- The seller needs to update status even if they didn't create the record
DROP POLICY IF EXISTS deals_update_participants_or_admin ON public.deals;
CREATE POLICY deals_update_participants_or_admin
  ON public.deals FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      buyer_id = auth.uid() 
      OR seller_id = auth.uid()
      OR exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin = true
      )
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      buyer_id = auth.uid() 
      OR seller_id = auth.uid()
      OR exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin = true
      )
    )
  );

-- 4. IMPORTANT: Enable REPLICA IDENTITY FULL if we need full row in realtime updates (often needed for proper filtering)
ALTER TABLE public.deals REPLICA IDENTITY FULL;
