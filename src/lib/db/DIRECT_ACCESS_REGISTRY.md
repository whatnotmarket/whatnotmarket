# Registro accessi diretti a PostgreSQL

Questo file documenta tutti i punti del codice che accedono direttamente
a Postgres tramite il client `pg`, bypassando le Row Level Security policies di Supabase.

## Regola

- Accesso diretto **ammesso**: cron job, script di migrazione, operazioni bulk interne, strumenti operativi eseguiti in ambiente controllato.
- Accesso diretto **da evitare** nelle API pubbliche: preferire `@supabase/ssr` / `@supabase/supabase-js` con RLS per richieste che riflettono privilegi utente.

## File con accesso diretto (`pg` / `Client`)

| File | Motivo | Input utente? | Note |
|------|--------|---------------|------|
| `scripts/db/check-follows-table.js` | Verifica schema / debug | No | Script manuale |
| `scripts/db/check-notifications-table.js` | Verifica schema / debug | No | Script manuale |
| `scripts/migrations/apply-migration.js` | Migrazioni SQL | No | Esecuzione controllata |
| `scripts/migrations/apply-blocks-migration.js` | Migrazioni SQL | No | Esecuzione controllata |
| `scripts/migrations/apply-follows-migration.js` | Migrazioni SQL | No | Esecuzione controllata |
| `scripts/migrations/apply-follows-migration-retry.js` | Migrazioni SQL | No | Esecuzione controllata |
| `scripts/migrations/apply-global-chat-migration.js` | Migrazioni SQL | No | Esecuzione controllata |
| `scripts/migrations/apply-reports-update-migration.js` | Migrazioni SQL | No | Esecuzione controllata |
| `scripts/migrations/fix-notifications-and-follows.js` | Riparazione dati | No | Script manutenzione |
| `scripts/realtime/enable-realtime-blocks.js` | Config realtime | No | Script manuale |

## Codice TypeScript applicativo (`src/`)

Al momento dell’ultimo audit **non** risultano import di `pg` in `src/**/*.ts(x)`. L’app usa principalmente Supabase (`@supabase/supabase-js`, `@supabase/ssr`) per le query runtime.

La dipendenza `pg` in `package.json` è usata dagli script sopra e da eventuali job futuri; nuovi usi in `src/app/api/**` devono essere giustificati o sostituiti con il client Supabase.

## Ultimo audit

- **Data:** 2026-03-22
- **Ambito:** grep su `pg`, `Pool`, `new Client` in `src/`, `scripts/`, `jobs/`; revisione manuale API routes.
