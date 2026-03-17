-- Script ULTIMATE per cancellare utenti non protetti usando UUID
-- Questo script elimina TUTTI gli utenti tranne i due ID specificati
-- e tutti i dati a loro collegati in tutte le tabelle.

BEGIN;

-- Lista ID da mantenere:
-- e152fb37-a5c7-475e-805d-d14eb4caa13c
-- fbf627bc-c907-4f88-8ff2-a1857891ce65

-- 1. Elimina i messaggi della chat
DELETE FROM public.chat_messages 
WHERE sender_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 2. Elimina i blocchi utenti
DELETE FROM public.user_blocks
WHERE blocker_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65')
   OR blocked_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 3. Elimina i follow
DELETE FROM public.follows
WHERE follower_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65')
   OR following_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 4. Elimina le trattative (deals)
DELETE FROM public.deals 
WHERE buyer_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65')
   OR seller_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 5. Elimina le offerte (offers)
DELETE FROM public.offers 
WHERE created_by NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 6. Elimina le richieste (requests)
DELETE FROM public.requests 
WHERE created_by NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 7. Elimina i codici invito
DELETE FROM public.invite_codes
WHERE created_by NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65')
   OR used_by NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 8. Elimina le verifiche venditore (se la tabella esiste)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'seller_verifications') THEN
        DELETE FROM public.seller_verifications
        WHERE used_by_user_id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');
    END IF;
END $$;

-- 9. ELIMINAZIONE PROFILI FORZATA
DELETE FROM public.profiles 
WHERE id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

-- 10. Infine elimina gli utenti da auth.users
DELETE FROM auth.users 
WHERE id NOT IN ('e152fb37-a5c7-475e-805d-d14eb4caa13c', 'fbf627bc-c907-4f88-8ff2-a1857891ce65');

COMMIT;
