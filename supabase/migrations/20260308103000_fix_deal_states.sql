-- Fix inconsistent deal states and backfill last_action_by

DO $$
BEGIN
    -- 1. Backfill last_action_by with sender_id if it is null
    UPDATE public.deals
    SET last_action_by = sender_id
    WHERE last_action_by IS NULL AND sender_id IS NOT NULL;

    -- 2. If sender_id is also null (legacy deals), assume created_by from offers table if possible, or defaulting to buyer for initial offers?
    -- Since we relaxed the schema, we might not have offers link.
    -- For now, let's just assume if it's 'offer_sent', the buyer sent it (standard flow).
    UPDATE public.deals
    SET sender_id = buyer_id, last_action_by = buyer_id
    WHERE sender_id IS NULL AND status = 'offer_sent';

END $$;
