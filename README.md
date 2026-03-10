# Whatnot Market

A buyer/seller marketplace web app built with Next.js, Tailwind CSS, and Supabase.

## Features

- **Auth0-Centered Auth**: Email passwordless, Google, Apple, Wallet Connect, Telegram.
- **Role by Invite Code**: Optional invite code assigns `buyer` or `seller` role.
- **Request-Driven Marketplace**: Buyers post requests, sellers make offers.
- **Deal Room**: Real-time chat and transaction timeline for accepted offers.
- **Secure Payments (Escrow)**:
  - Multi-chain support (Ethereum, Polygon, Base, Bitcoin).
  - Mock payment adapter for demo purposes.
  - Buyer pays -> Funds held -> Seller fulfills -> Funds released.
- **Listing Wallet Escrow**:
  - Authenticated users can connect and verify wallet ownership.
  - Listing payments go to platform escrow first.
  - Admin manually releases escrow to target wallet with audit trail.
- **Onboarding Wizard**:
  - Role selection (Buyer/Seller).
  - Payout wallet setup.
  - Telegram verification (Mocked).
- **Admin Dashboard**: Moderate content and resolve payment disputes.
- **Premium UI**: Dark mode first, fluid animations, glassmorphism effects.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Icons**: Lucide React
- **State**: TanStack Query
- **Backend**: Auth0 + Supabase (Postgres, Realtime, bridge auth session)
- **Forms**: React Hook Form + Zod

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com).
   - Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) and apply the SQL migrations in `supabase/migrations`.
   - Copy your project URL, anon key, and service-role key.

3. **Environment Variables**:
   - Copy `.env.example` to `.env.local`.
   - Fill in the required values (Supabase + admin + wallet vars).

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Access the app**:
   - Go to `http://localhost:3000`.
   - Use `/login` for Auth0/email/social/external auth flows.

## Demo Workflows

### Onboarding
- After signing up, you will be redirected to `/onboarding`.
- Choose **"I want to sell"** to see the full flow.
- **Telegram Verification**: Click "Open Telegram Bot" to generate a mock code, then copy-paste it to verify.

### Payments (Deal Room)
- Go to any deal (or create a request -> make offer -> accept).
- **Buyer View**: Select a network/token (e.g., Ethereum / USDC). Click "Pay".
- **Deposit**: A QR code and address will appear.
- **Simulate**: Click "Simulate Payment (Demo)" to instantly fund the deal.
- **Seller View**: Toggle "View as Seller" to see the "Awaiting Payment" status change to "Funds Secured".

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security Checklist (Supabase + GitHub)

- Do not expose secrets in the frontend
  - Frontend uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only
  - Backend uses `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Do not commit `.env` files
  - `.gitignore` includes `.env*`; use `.env.example` for documentation
- Do not hardcode keys in source
  - Always read from `process.env.*`
- Enforce Row Level Security (RLS)
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
  - Policies restrict read/write by `auth.uid()` when appropriate
- Keep migrations versioned
  - Use `supabase/migrations/*.sql` for schema changes
- Keep operational scripts private
  - Use `supabase/scripts/private/` (ignored by Git)
  - No real data or secrets inside the repository
- Avoid public endpoints without auth
  - Check auth in server routes and edge functions
- Rate limiting and spam protection
  - Flood and slow-mode checks are implemented for chat; add rate-limits where needed
