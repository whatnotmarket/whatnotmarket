-- Script per eliminare tutti gli utenti tranne 'whatnotmarket' e 'testbuyer'
-- Questo eliminerà anche i dati correlati (profili, chat, ordini) grazie al CASCADE
-- Assicurati di eseguire questo script con i permessi di amministratore o nel SQL Editor di Supabase.

-- 1. Identifica gli ID da mantenere (quelli che corrispondono agli username specificati)
WITH protected_users AS (
    SELECT id 
    FROM public.profiles 
    WHERE username IN ('whatnotmarket', 'testbuyer')
)
-- 2. Elimina tutti gli utenti da auth.users che NON sono nella lista protetta
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM protected_users);

-- Se non esistono utenti protetti (es. database vuoto o username errati), 
-- questo script ELIMINERÀ TUTTI GLI UTENTI. Fai attenzione.
