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
7. `supabase/migrations/20260306143000_seller_invite_code_claims.sql`
8. `supabase/migrations/20260306144000_remove_legacy_invite_only.sql`
9. `supabase/migrations/20260306150000_auth_bridge_wallet_escrow.sql`

Queste migration includono:
- tutte le tabelle del progetto
- enum necessari
- trigger profilo utente automatico su signup
- indici
- policy RLS complete
- seed iniziale per payment catalog
- funzione RPC che apre la chat solo dopo accettazione seller (`accept_offer_and_open_chat`)
- sistema notifiche realtime buyer/seller (`notifications` + trigger automatici)
- campi request per listing reale (`payment_method`, `delivery_time`)
- bridge identities esterne (`auth_bridge_identities`)
- wallet linking verificato (`wallets`)
- pagamenti listing in escrow con release manuale admin (`listing_payments`, `escrow_actions`)

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
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Invite role codes (comma-separated)
SELLER_INVITE_CODES=SELLER-XXXXXX,SELLER-YYYYYY
BUYER_INVITE_CODES=BUYER-XXXXXX,BUYER-YYYYYY

# Auth0
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CONNECTION_EMAIL=email
AUTH0_CONNECTION_GOOGLE=google-oauth2
AUTH0_CONNECTION_APPLE=apple
AUTH0_CONNECTION_WALLET=
AUTH0_CONNECTION_TELEGRAM=
AUTH_BRIDGE_SECRET=...
AUTH_BRIDGE_EMAIL_DOMAIN=auth.local

# Telegram external adapter
NEXT_PUBLIC_TELEGRAM_BOT_ID=
TELEGRAM_BOT_TOKEN=

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Platform escrow wallet
NEXT_PUBLIC_PLATFORM_ESCROW_WALLET=...

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
  to_regclass('public.notifications') as notifications,
  to_regclass('public.seller_invite_code_claims') as seller_invite_code_claims,
  to_regclass('public.auth_bridge_identities') as auth_bridge_identities,
  to_regclass('public.wallets') as wallets,
  to_regclass('public.listing_payments') as listing_payments,
  to_regclass('public.escrow_actions') as escrow_actions;
```

Se tutte le colonne restituiscono il nome tabella (non `null`), il setup DB e pronto.

