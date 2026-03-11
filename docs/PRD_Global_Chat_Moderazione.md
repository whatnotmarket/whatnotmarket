# PRD — Moderazione Global Chat

## Scopo
- Rendere la moderazione della global chat semplice, veloce e sicura, con un pannello esterno (dashboard admin) e regole lato server chiare.
- Prevenire spam, abusi e violazioni; dare strumenti a moderatori/admin per mute/ban/delete, slow-mode e chiusura stanza; garantire feedback immediato lato client e audit trail lato DB.

## Obiettivi
- Moderazione real-time senza refresh lato admin e lato utente.
- Chiusura stanza permanente o temporanea.
- Slow-mode per stanza e enforcement lato server.
- Mute/ban utente con riflesso immediato in chat; unmute/unban altrettanto immediati.
- Soft-delete del singolo messaggio o cancellazione massiva di messaggi utente quando bannato.
- UI chiara con solo due azioni per messaggio (Delete/Ban) e un menu utente.
- Audit completo con global_chat_moderation_logs.

## Non-obiettivi
- Moderazione contenuti avanzata con ML.
- Sistema ban/mute cross-servizi fuori dalla chat globale.

## Attori e Ruoli
- Utente normale: scrive in chat se ammesso (ruolo stanza, non bannato/mutato, non in slow-mode bloccante).
- Moderatore: imposta slow-mode e chiusura stanza; può moderare thread help; può mute/ban (se abilitato).
- Admin: pieno controllo; può impostare slow-mode/chiusura; mute/ban; delete message; unmute/unban; comandi bulk.

## Schema Dati (Supabase/Postgres)
- global_chat_messages
  - id (uuid), user_id (uuid), room (text), message (text), created_at (timestamptz), reply_to_id (uuid|null), mentioned_handles (text[]), is_deleted (boolean default false)
  - RLS: SELECT pubblico filtrato su is_deleted=false; INSERT/UPDATE controllati dalle API.
- global_chat_user_controls
  - user_id (uuid PK), is_muted (boolean), muted_until (timestamptz|null), is_banned (boolean), banned_until (timestamptz|null), is_moderator (boolean), moderator_override (boolean)
  - RLS: SELECT per il proprietario (user_id = auth.uid()); scrittura via service role key in API admin/moderation.
- global_chat_room_state
  - room_slug (text PK), slow_mode_seconds (int default 0), closed_until (timestamptz|null)
  - RLS: SELECT pubblico; scrittura via service role key.
- global_chat_moderation_logs
  - id (uuid), user_id (uuid|null), room (text|null), message (text|null), code (text), reason (text), metadata (jsonb), created_at (timestamptz)
  - RLS: solo admin legge e scrive; usato per audit.

## Pubblicazioni Realtime
- supabase_realtime include:
  - public.global_chat_messages
  - public.global_chat_user_controls
  - public.global_chat_room_state

## API & Endpoints
- GET /api/admin/dashboard/public-chat
  - Query: room?, q?, limit?, userId?
  - Ritorna: messages (flagged), activeUsers, roomState, userHistory.
  - Autorizzazione: admin token.
  - Implementazione: [route.ts](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/api/admin/dashboard/public-chat/route.ts).
- POST /api/admin/dashboard/public-chat
  - Payload: { action, messageId?, userId?, reason?, muteMinutes? }
  - Azioni: delete_message, ban_message, mute_user, ban_user, unmute_user, unban_user.
  - Effetti: update su tabelle + inserimento global_chat_moderation_logs; realtime per riflesso lato client.
  - Implementazione: [route.ts](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/api/admin/dashboard/public-chat/route.ts#L160-L211).
- POST /api/moderation/public-chat/room-state
  - Payload: { action: "slow_mode"|"close"|"open", room, seconds?, minutes? }
  - Effetti: aggiorna slow_mode_seconds o closed_until; chiusura permanente se minutes<=0.
  - Autorizzazione: admin oppure moderatore.
  - Implementazione: [room-state route](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/api/moderation/public-chat/room-state/route.ts).
- POST /api/global-chat/messages
  - Enforcement: ban/mute/slow-mode/role; logging in global_chat_moderation_logs; errori senza toast lato client.
  - Implementazione: [messages route](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/api/global-chat/messages/route.ts).

## Logica Side Client (Global Chat)
- Realtime INSERT/UPDATE su global_chat_messages
  - INSERT: fetch del messaggio; merge; soft cap 300.
  - UPDATE: se is_deleted=true, rimuove immediatamente dalla UI; altrimenti aggiorna.
  - Implementazione: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/global-chat/GlobalChatClient.tsx#L600-L620).
- Realtime UPDATE/INSERT su global_chat_user_controls (utente corrente)
  - Aggiorna stato banned/muted in tempo reale; blocca l’input; mostra banner inline (“You are banned…”, “You are muted…”); niente toast.
  - Implementazione: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/global-chat/GlobalChatClient.tsx#L852-L876).
- Stato stanza realtime (global_chat_room_state)
  - slow_mode_seconds + closed_until; banner “Slow mode attivo (Xs)” o “This chat is closed”; blocco input; countdown per slow-mode e chiusura temporanea.
  - Implementazione: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/global-chat/GlobalChatClient.tsx#L880-L904).
- Placeholder input coerente:
  - Banned: “You are banned from global chat.”
  - Muted: “You are muted for X seconds.”
  - Closed: “This chat is closed”
  - Slow-mode: “Slow mode active”
  - Implementazione: [GlobalChatClient.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/global-chat/GlobalChatClient.tsx#L1869-L1875).

## Dashboard Moderatore (Admin/Public Chat)
- Top controls:
  - Language selector; search; indicatori Room (OPEN/CLOSED) e Slow (OFF/10s/30s/60s); Close room; Open room; Reload.
  - Implementazione: [page.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/admin/public-chat/page.tsx#L104-L136).
- Stream messaggi (colonna sinistra):
  - Card con Username, Lingua, Timestamp, Testo; ‘Message removed’ per deleted; flagged con ring arancione.
  - Action visibili: Delete (neutro), Ban (rosso).
  - Menu “User ▾”: Mute 5m/30m/1h, Ban, Unmute, Unban, View history.
  - Implementazione: [page.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/admin/public-chat/page.tsx#L145-L214).
- Active Users (colonna destra):
  - Lista con badge status: online, muted, banned; bottone Details; scheda dettaglio con azioni e storico recente.
  - Implementazione: [page.tsx](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/app/admin/public-chat/page.tsx#L215-L281).

## Sicurezza & RLS
- Mai usare service role key nel frontend; solo in [supabase-admin.ts](file:///c:/Users/2VibesApp/Desktop/swaprmarket/src/lib/supabase-admin.ts).
- .gitignore esclude .env* e script privati; usare .env.example per documentare variabili richieste.
- RLS:
  - global_chat_messages: SELECT pubblico con is_deleted=false; API controllano inserimenti.
  - global_chat_user_controls: SELECT owner; scrittura via service role.
  - global_chat_room_state: SELECT pubblico; scrittura via service role.
- Policy di esempio:
  ```sql
  create policy global_chat_user_controls_select_owner
    on public.global_chat_user_controls
    for select to authenticated
    using (user_id = auth.uid());

  drop policy if exists "Anyone can read global chat messages" on public.global_chat_messages;
  create policy "Anyone can read global chat messages not deleted"
    on public.global_chat_messages
    for select to anon, authenticated
    using (is_deleted = false);
  ```

## SQL di Moderazione (funzioni)
```sql
-- DELETE MESSAGE
create or replace function public.admin_delete_message(p_message_id uuid, p_reason text default 'Removed by admin')
returns void language plpgsql security definer set search_path = public as $$
declare r record; begin
  select id, user_id, room, message into r from public.global_chat_messages where id = p_message_id;
  update public.global_chat_messages set is_deleted = true where id = p_message_id;
  insert into public.global_chat_moderation_logs(user_id, room, message, code, reason, metadata)
  values (r.user_id, r.room, r.message, 'ADMIN_DELETE_MESSAGE', coalesce(p_reason, 'Removed by admin'), jsonb_build_object('message_id', p_message_id));
end; $$;

-- BAN MESSAGE
create or replace function public.admin_ban_message(p_message_id uuid, p_reason text default 'Banned by admin')
returns void language plpgsql security definer set search_path = public as $$
declare r record; begin
  select id, user_id, room, message into r from public.global_chat_messages where id = p_message_id;
  update public.global_chat_messages set is_deleted = true where id = p_message_id;
  insert into public.global_chat_moderation_logs(user_id, room, message, code, reason, metadata)
  values (r.user_id, r.room, r.message, 'ADMIN_BAN_MESSAGE', coalesce(p_reason, 'Banned by admin'), jsonb_build_object('message_id', p_message_id));
end; $$;

-- MUTE USER
create or replace function public.admin_mute_user(p_user_id uuid, p_minutes int default 60, p_reason text default 'Muted by admin')
returns void language plpgsql security definer set search_path = public as $$
declare v_until timestamptz; begin
  v_until := now() + make_interval(mins => greatest(1, p_minutes));
  insert into public.global_chat_user_controls (user_id, is_muted, muted_until)
  values (p_user_id, true, v_until)
  on conflict (user_id) do update set is_muted = excluded.is_muted, muted_until = excluded.muted_until;
  insert into public.global_chat_moderation_logs(user_id, code, reason, metadata)
  values (p_user_id, 'ADMIN_MUTE_USER', coalesce(p_reason, 'Muted by admin'), jsonb_build_object('muted_until', v_until));
end; $$;

-- BAN USER + DELETE ALL MESSAGES
create or replace function public.admin_ban_user(p_user_id uuid, p_reason text default 'Banned by admin')
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.global_chat_user_controls (user_id, is_banned, banned_until)
  values (p_user_id, true, null)
  on conflict (user_id) do update set is_banned = excluded.is_banned, banned_until = excluded.banned_until;
  update public.global_chat_messages set is_deleted = true where user_id = p_user_id;
  insert into public.global_chat_moderation_logs(user_id, code, reason, metadata)
  values (p_user_id, 'ADMIN_BAN_USER', coalesce(p_reason, 'Banned by admin'), jsonb_build_object('deleted_all_messages', true));
end; $$;

-- UNBAN ALL USERS (bulk)
create or replace function public.admin_unban_all()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.global_chat_moderation_logs (user_id, code, reason, metadata)
  select u.user_id, 'ADMIN_UNBAN_USER', 'Bulk unban', jsonb_build_object('bulk', true)
  from public.global_chat_user_controls u
  where coalesce(u.is_banned, false) = true or u.banned_until is not null;
  update public.global_chat_user_controls set is_banned = false, banned_until = null;
end; $$;

-- Permessi (service_role)
revoke all on function public.admin_delete_message(uuid, text) from public;
revoke all on function public.admin_ban_message(uuid, text) from public;
revoke all on function public.admin_mute_user(uuid, int, text) from public;
revoke all on function public.admin_ban_user(uuid, text) from public;
revoke all on function public.admin_unban_all() from public;
grant execute on function public.admin_delete_message(uuid, text) to service_role;
grant execute on function public.admin_ban_message(uuid, text) to service_role;
grant execute on function public.admin_mute_user(uuid, int, text) to service_role;
grant execute on function public.admin_ban_user(uuid, text) to service_role;
grant execute on function public.admin_unban_all() to service_role;
```

## Flussi UI (Global Chat)
- Banner minimal:
  - Banned: testo rosso “You are banned to write here”.
  - Muted: “You are muted to write here”.
  - Slow-mode: “Slow mode attivo (Xs)”.
  - Closed: “This chat is closed” (permanente) oppure “This chat is closed for Xs”.
- Input:
  - Disabilitato se banned/muted/slowed/closed; placeholder coerente; nessun toast globale di errore.
- Realtime:
  - Quando admin/mod clicca azioni, UI utente riflette immediatamente.

## Flussi UI (Dashboard Moderazione)
- Top section:
  - Selettore lingua; search; indicatori; slow mode quick; Close/Open; Reload.
- Messaggi:
  - 2 pulsanti: Delete e Ban; menu utente “User ▾” con azioni e “View history”.
- Active users:
  - Lista con badge status e “Details” per aprire scheda con azioni e storico.

## Edge Cases
- Slow-mode vs mute: mute prevale; slow-mode calcola il tempo residuo sull’ultimo messaggio nella stessa stanza.
- Closed permanente: chiusura con closed_until molto nel futuro; banner senza icona.
- Ban massivo: quando si banna un utente, tutti i suoi messaggi diventano deleted; UI riflette via realtime UPDATE.

## Rate Limit/Anti-spam
- Flood limit server-side (minimo 5s tra messaggi a thread root); slow-mode stanza; duplicate check; blocked phrases; logging rifiuti.

## Telemetria
- Logging azioni admin/mod in global_chat_moderation_logs con metadata (message_id, deleted_all_messages, muted_until).
- Possibile integrazione privacy-friendly con Ackee (già integrato) o GA (opzionale).

## Test Plan
- Unit
  - API: room-state slow_mode/close/open; moderazione POST; global-chat/messages enforcement.
- E2E
  - Admin: delete/ban/mute/unmute/unban/close/open; riflesso realtime lato admin e utente.
  - Utente: banner e blocco input al cambiamento di stato; placeholder coerente; insert/update messages realtime.

## Rollout
- Applica migrazioni SQL; verifica publication; configura policy.
- Deploy API; abilita admin panel; test funzionale su ambiente staging.
- Migrazione finale su produzione; monitoraggio global_chat_moderation_logs.

## Operatività
- Comandi rapidi (SQL) nel README o tool privati; script operativi in `supabase/scripts/private/` (ignorati da Git).
- Checklist sicurezza nel README; .env.example aggiornato; nessun secrets in frontend.

