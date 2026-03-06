# Supabase Setup (Completo)

Questa guida copre tutte le impostazioni Supabase richieste dal progetto `whatnotmarket`.

## 1) Crea il progetto Supabase

1. Vai su Supabase e crea un nuovo project.
2. Salva queste 3 chiavi:
- `Project URL`
- `anon public key`
- `service_role key`

## 2) Configura Auth

In **Authentication -> Providers**:
- Email: `Enabled`

In **Authentication -> URL Configuration**:
- Site URL: `http://localhost:3000` (in sviluppo)
- Additional Redirect URLs: aggiungi almeno
  - `http://localhost:3000/**`
  - il dominio di produzione quando deployi

In **Authentication -> Email**:
- Per sviluppo rapido: puoi disattivare `Confirm email`.
- Per produzione: consigliato `Confirm email` attivo + SMTP configurato.

## 3) Applica schema e seed

Usa le migration in `supabase/migrations`.

Ordine consigliato (se usi SQL Editor manualmente):
1. `supabase/migrations/20250305_create_proxy_orders.sql`
2. `supabase/migrations/20260306070000_full_project_schema.sql`
3. `supabase/migrations/20260306071000_seed_reference_data.sql`
4. `supabase/migrations/20260306090000_offer_acceptance_chat_rpc.sql`
5. `supabase/migrations/20260306100000_notifications_system.sql`
6. `supabase/migrations/20260306101000_requests_market_fields.sql`

Queste migration includono:
- tutte le tabelle del progetto
- enum necessari
- trigger profilo utente automatico su signup
- indici
- policy RLS complete
- seed iniziale per payment catalog e invite `VIP2026`
- funzione RPC che apre la chat solo dopo accettazione seller (`accept_offer_and_open_chat`)
- sistema notifiche realtime buyer/seller (`notifications` + trigger automatici)
- campi request per listing reale (`payment_method`, `delivery_time`)

## 4) Promuovi il primo admin

Dopo aver creato il primo account nell'app, esegui:

```sql
update public.profiles
set is_admin = true
where email = 'la-tua-email@example.com';
```

## 5) Variabili ambiente richieste

Copia `.env.local.example` in `.env.local` e compila tutte le variabili:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Invite flow
NEXT_PUBLIC_INVITE_CODE=VIP2026

# Admin auth (custom admin area)
ADMIN_PASSWORD=...
ADMIN_JWT_SECRET=...

# Payment verification wallets
NEXT_PUBLIC_TRON_WALLET=...
NEXT_PUBLIC_EVM_WALLET=...

# Tron token contracts (TRC20)
TRON_USDT_CONTRACT=...
TRON_USDC_CONTRACT=...
```

## 6) Cosa NON serve configurare adesso

- Storage buckets: non richiesti dal codice corrente.
- Edge Functions Supabase: non richieste dal codice corrente.

## 7) Verifica rapida post-setup

Puoi eseguire questo check in SQL Editor:

```sql
select
  to_regclass('public.profiles') as profiles,
  to_regclass('public.payment_intents') as payment_intents,
  to_regclass('public.proxy_orders') as proxy_orders,
  to_regclass('public.invite_codes') as invite_codes,
  to_regclass('public.notifications') as notifications;
```

Se tutte le colonne restituiscono il nome tabella (non `null`), il setup DB e pronto.

