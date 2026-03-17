-- Script per resettare tutti i follower e seguiti
-- Questo comando elimina TUTTE le relazioni di follow nel database

TRUNCATE TABLE public.follows CASCADE;

-- Nota: Questo non elimina gli utenti, ma solo le connessioni "segui" tra di loro.
-- Dopo l'esecuzione, tutti gli utenti avranno 0 follower e 0 seguiti.
