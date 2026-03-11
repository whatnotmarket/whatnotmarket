-- Script ULTIMATE per cancellare utenti non protetti
-- Disabilita temporaneamente i trigger per evitare blocchi

BEGIN;

-- 1. Elimina i messaggi della chat
DELETE FROM public.chat_messages 
WHERE sender_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 2. Elimina i blocchi utenti
DELETE FROM public.user_blocks
WHERE blocker_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'))
   OR blocked_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 3. Elimina i follow
DELETE FROM public.follows
WHERE follower_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'))
   OR following_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 4. Elimina le trattative (deals)
DELETE FROM public.deals 
WHERE buyer_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'))
   OR seller_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 5. Elimina le offerte (offers)
DELETE FROM public.offers 
WHERE created_by NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 6. Elimina le richieste (requests)
DELETE FROM public.requests 
WHERE created_by NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 7. Elimina i codici invito
DELETE FROM public.invite_codes
WHERE created_by NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'))
   OR used_by NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));

-- 8. Elimina le verifiche venditore (se la tabella esiste)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'seller_verifications') THEN
        DELETE FROM public.seller_verifications
        WHERE used_by_user_id NOT IN (SELECT id FROM public.profiles WHERE username IN ('swaprmarket', 'testbuyer'));
    END IF;
END $$;

-- 9. Elimina eventuali altre dipendenze (aggiungi qui se ne scopri altre)

-- 10. ELIMINAZIONE PROFILI FORZATA
-- Prima di eliminare da auth.users, dobbiamo ASSICURARCI che i profili siano andati
DELETE FROM public.profiles 
WHERE username NOT IN ('swaprmarket', 'testbuyer');

-- 11. Infine elimina gli utenti da auth.users
DELETE FROM auth.users 
WHERE id NOT IN (
    SELECT id FROM public.profiles 
    WHERE username IN ('swaprmarket', 'testbuyer')
);

COMMIT;
