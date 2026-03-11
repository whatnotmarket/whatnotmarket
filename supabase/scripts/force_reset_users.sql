-- Script COMPLETO per cancellare utenti non protetti e tutti i loro dati
-- Risolve l'errore di foreign key constraint cancellando prima i dati figli.

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

-- 4. Elimina le trattative (deals) - Coinvolgono buyer o seller da eliminare
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

-- 9. ORA possiamo eliminare i profili (la causa dell'errore precedente)
DELETE FROM public.profiles 
WHERE username NOT IN ('swaprmarket', 'testbuyer');

-- 10. Infine elimina gli utenti da auth.users
-- Nota: Usiamo una subquery sui profili rimasti per sicurezza
DELETE FROM auth.users 
WHERE id NOT IN (
    SELECT id FROM public.profiles 
    WHERE username IN ('swaprmarket', 'testbuyer')
);
