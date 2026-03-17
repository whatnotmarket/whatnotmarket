-- Script per resettare messaggi e status (trattative) tra utenti

-- 1. Cancella tutti i messaggi della chat
TRUNCATE TABLE public.chat_messages CASCADE;

-- 2. Cancella tutte le trattative (questo resetta lo status "Verifica", "Completato", ecc.)
TRUNCATE TABLE public.deals CASCADE;

-- 3. Cancella tutte le offerte collegate alle trattative
TRUNCATE TABLE public.offers CASCADE;

-- 4. (Opzionale) Se vuoi resettare anche i blocchi e i follow
-- TRUNCATE TABLE public.user_blocks CASCADE;
-- TRUNCATE TABLE public.follows CASCADE;

-- Nota: L'uso di CASCADE assicura che vengano rimossi anche i dati collegati nelle tabelle dipendenti.
