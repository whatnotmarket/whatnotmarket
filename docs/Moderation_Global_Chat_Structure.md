# Moderazione Global Chat â€” Struttura completa (DB, API, Realtime, UI)

## Panoramica
- Chat globale con moderazione realtime: delete/ban/mute, slowâ€‘mode per stanza, chiusura stanza temporanea o permanente.
- Due viste: client utente (Global Chat) e dashboard moderatore/admin (Admin Public Chat).
- Obiettivo: azioni rapide, sicure, con feedback immediato e audit completo.

## Architettura a livelli
- Client utente (Next.js): [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/global-chat/GlobalChatClient.tsx)
- Dashboard moderatore: [admin/public-chat/page.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/admin/public-chat/page.tsx)
- API server:
  - Moderazione stanza: [room-state/route.ts](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/moderation/public-chat/room-state/route.ts)
  - Azioni admin: [admin/dashboard/public-chat/route.ts](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/admin/dashboard/public-chat/route.ts)
  - Post messaggi: [global-chat/messages/route.ts](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/global-chat/messages/route.ts)
- DB (Supabase/Postgres) + Realtime + RLS + Migrazioni: [supabase/migrations](file:///c:/Users/2VibesApp/Desktop/openlymarket/supabase/migrations)

## Schema dati (tabelle principali)
- public.global_chat_messages
  - id (uuid), user_id (uuid), room (text), message (text), created_at (timestamptz), reply_to_id (uuid|null), mentioned_handles (text[]), is_deleted (boolean default false)
  - RLS: SELECT pubblico con `is_deleted=false` (policy â€œnot deletedâ€); insert/update via API.
- public.global_chat_user_controls
  - user_id (uuid PK), is_muted (bool), muted_until (timestamptz|null), is_banned (bool), banned_until (timestamptz|null), is_moderator (bool), moderator_override (bool)
  - RLS: SELECT solo owner (`user_id = auth.uid()`), scrittura via service role key.
- public.global_chat_room_state
  - room_slug (text PK), slow_mode_seconds (int default 0), closed_until (timestamptz|null)
  - RLS: SELECT pubblico, scrittura via service role key.
- public.global_chat_moderation_logs
  - id, user_id, room, message, code, reason, metadata (jsonb), created_at
  - Audit moderazione; lettura/gestione solo admin.

## Migrazioni richieste
- Soft delete: [20260310171000_global_chat_soft_delete.sql](file:///c:/Users/2VibesApp/Desktop/openlymarket/supabase/migrations/20260310171000_global_chat_soft_delete.sql)
- Stato stanza: [20260310172000_global_chat_room_state.sql](file:///c:/Users/2VibesApp/Desktop/openlymarket/supabase/migrations/20260310172000_global_chat_room_state.sql)
- Realtime tabelle moderazione: [20260310173000_realtime_global_chat_controls.sql](file:///c:/Users/2VibesApp/Desktop/openlymarket/supabase/migrations/20260310173000_realtime_global_chat_controls.sql)

## Policy RLS (estratti)
- Messaggi (lettura pubblica filtrata):
  - Policy: â€œAnyone can read global chat messages not deletedâ€ â†’ `USING (is_deleted = false)`
- Controlli utente (lettura owner):
  - Policy: `USING (user_id = auth.uid())`
- Stato stanza: SELECT pubblico

## Pubblicazioni Realtime
- supabase_realtime include:
  - public.global_chat_messages
  - public.global_chat_user_controls
  - public.global_chat_room_state

## Endpoint â€” Moderazione
- GET /api/admin/dashboard/public-chat
  - Query: `room?`, `q?` (search), `limit?`, `userId?`
  - Risposta: `messages` (+flagged), `activeUsers`, `roomState`, `userHistory`
  - Implementazione: [public-chat GET](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/admin/dashboard/public-chat/route.ts#L16-L65)
- POST /api/admin/dashboard/public-chat
  - Azioni:
    - `delete_message` â†’ `is_deleted=true` + log
    - `ban_message` â†’ `is_deleted=true` + log
    - `mute_user` â†’ set `is_muted=true`, `muted_until` + log
    - `ban_user` â†’ set `is_banned=true` + soft-delete di tutti i suoi messaggi + log
    - `unmute_user` / `unban_user` â†’ reset stato + log
  - Implementazione: [public-chat POST](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/admin/dashboard/public-chat/route.ts#L160-L211)
- POST /api/moderation/public-chat/room-state
  - Azioni: `slow_mode`, `close`, `open`
  - `close` permanente se `minutes<=0` (chiusura fino al 2099), altrimenti temporanea
  - Implementazione: [room-state POST](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/moderation/public-chat/room-state/route.ts)
- POST /api/global-chat/messages
  - Enforcement: ban/mute/slow-mode/ruoli; flood limit; duplicate; blocked phrases; logging rifiuti
  - Implementazione: [messages POST](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/api/global-chat/messages/route.ts)

## Enforcement lato server (principali)
- Ban attivo: rifiuta post, logga â€œBAN_ACTIVEâ€
- Mute attivo: rifiuta post, logga â€œMUTE_ACTIVEâ€
- Slowâ€‘mode attivo: se lâ€™utente ha post recenti in finestra Xs, rifiuta â€œSLOW_MODEâ€ con secondi residui
- Ruoli stanza:
  - Sell Services: solo seller avvia thread; buyer puÃ² rispondere
  - Buy Services: solo buyer avvia thread; seller puÃ² rispondere
- Chiusura stanza:
  - `closed_until > now` â†’ rifiuta post â€œROOM_CLOSEDâ€

## Realtime lato client (utente)
- Messaggi: subscribe INSERT/UPDATE; se `is_deleted=true` â†’ rimozione immediata
- Controlli utente (proprio user_id): subscribe UPDATE/INSERT â†’ banner + blocco input
- Stato stanza: subscribe UPDATE â†’ banner slow/closed; blocco input
- Implementazione chiave:
  - Controlli utente: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/global-chat/GlobalChatClient.tsx#L852-L876)
  - Stato stanza: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/global-chat/GlobalChatClient.tsx#L880-L904)
  - Placeholder e disabled: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/global-chat/GlobalChatClient.tsx#L1869-L1878)

## UI â€” Global Chat (utente)
- Banner inline (trasparenti, minimal, allineati):
  - Banned: rosso â€œYou are banned to write hereâ€
  - Muted: â€œYou are muted to write hereâ€
  - Slowâ€‘mode: icona + â€œSlow mode attivo (Xs)â€
  - Closed permanente: â€œThis chat is closedâ€; closed temporaneo: â€œThis chat is closed for Xsâ€
- Input:
  - Bloccato se banned/muted/slowed/closed
  - Placeholder dinamico:
    - Banned: â€œYou are banned from global chat.â€
    - Muted: â€œYou are muted for X seconds.â€
    - Closed: â€œThis chat is closedâ€
    - Slowâ€‘mode: â€œSlow mode activeâ€
- Nessun toast globale per ban/mute/slow/closed; feedback solo inline
- Implementazione: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/global-chat/GlobalChatClient.tsx)

## UI â€” Admin Public Chat (moderatore/admin)
- Top controls:
  - Selettore room (lingua), search
  - Indicatori: Room (OPEN/CLOSED), Slow (OFF/Ns)
  - Slowâ€‘mode quick buttons: OFF, 10s, 30s, 60s
  - Close room (permanente) / Open room
  - Reload
- Stream messaggi (colonna sinistra):
  - Card con Username, Lingua, Timestamp, Testo; deleted â†’ â€œMessage removedâ€ con stile grigio/lineâ€‘through
  - Azioni visibili (solo 2): Delete (neutro), Ban (rosso)
  - Menu â€œUser â–¾â€: Mute 5m/30m/1h, Ban, Unmute, Unban, View history
- Active Users (colonna destra):
  - Lista utenti attivi (ultimi 15 min) con status badge: online/muted/banned
  - Details: scheda utente con count messaggi, last message time, azioni rapide e storico
- Realtime: subscribe INSERT/UPDATE su global_chat_messages per refresh automatico
- Implementazione: [admin/public-chat/page.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/admin/public-chat/page.tsx)

## Logging/Audit
- global_chat_moderation_logs:
  - Codici evento: ADMIN_DELETE_MESSAGE, ADMIN_BAN_MESSAGE, ADMIN_MUTE_USER, ADMIN_BAN_USER, ADMIN_UNMUTE_USER, ADMIN_UNBAN_USER
  - Metadata: `message_id`, `deleted_all_messages`, `muted_until`, ecc.
  - Tracciamento sia degli interventi admin/mod sia dei rifiuti lato server

## Sicurezza & Chiavi
- Frontend:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (solo anon key)
- Backend:
  - `SUPABASE_SERVICE_ROLE_KEY` solo in [supabase-admin.ts](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/lib/supabase-admin.ts)
- .gitignore:
  - `.env*` ignorati; `.env.example` tracciato per documentazione
  - Script operativi privati in `supabase/scripts/private/` (ignorati)

## Telemetria (opzionale)
- Google Analytics (gtag) a livello globale via layout: [layout.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/app/layout.tsx#L86-L98)
- Ackee selfâ€‘hosted (privacy friendly) con pageview su cambio route: [AckeeTracker.tsx](file:///c:/Users/2VibesApp/Desktop/openlymarket/src/components/providers/AckeeTracker.tsx)

## Test & Rollout
- Unit/API: enforcement messaggi, roomâ€‘state, azioni admin
- E2E: admin delete/ban/mute/unmute/unban/close/open; riflesso realtime su utenza e pannello
- Rollout:
  - Applica migrazioni e verifica publication
  - Configura policy e variabili dâ€™ambiente
  - Deploy API e pannello; smoke test in staging; monitoraggio audit log

