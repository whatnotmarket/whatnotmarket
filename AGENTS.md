# OpenlyMarket Agent Guide

This document provides operational instructions for AI agents working on the OpenlyMarket repository.

## 1. Project Overview
- **Type**: Marketplace for digital goods (crypto payments, escrow, accounts, services).
- **Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Realtime).
- **Key Features**: Crypto payments, Escrow system, Real-time chat, Seller verification, Proxy orders.

## 2. Repository Structure
- `src/app/` -> App Router pages and layouts.
- `src/components/` -> UI components (shadcn/ui + custom).
- `src/lib/` -> Utilities, Supabase clients, core logic.
- `src/contexts/` -> Global state (User, Cart, Crypto, etc.).
- `supabase/migrations/` -> Database schema source of truth.
- `public/` -> Static assets.

## 3. Main Commands
- `npm run dev` -> Start development server.
- `npm run build` -> Production build.
- `npm run lint` -> Run ESLint.
- `npx tsc --noEmit` -> Run TypeScript type checking.

## 4. Routing Conventions
- **App Router**: Uses `page.tsx`, `layout.tsx`, `loading.tsx`.
- **Dynamic Routes**:
  - `/category/[category]` -> Category listing.
  - `/seller/[handle]` -> Public seller profile (vanity URL).
  - `/requests/[id]` -> Public marketplace request/listing.
  - `/deals/[id]` -> Private transactional page.
- **Private Routes**: `/admin`, `/dashboard`, `/inbox`, `/my-deals` (protected by middleware/auth).

## 5. Data and Content Sources
- **Database**: Supabase is the single source of truth.
- **Client Access**: Use `createClient()` from `@/lib/supabase` (browser/SSR).
- **Admin Access**: Use `createAdminClient()` from `@/lib/supabase-admin` (server-only, bypasses RLS).
- **Schema**: Refer to `supabase/migrations/*.sql` for table definitions (`profiles`, `requests`, `offers`, `deals`, `categories`).

## 6. SEO Conventions
- **Metadata**: Use Next.js `metadata` export in `layout.tsx` or `page.tsx`.
- **Sitemap**: Generated dynamically in `src/app/sitemap.ts` (includes static pages, categories, verified sellers, open requests).
- **Robots**: Configured in `src/app/robots.ts` (excludes admin/private routes).
- **Canonical**: `process.env.NEXT_PUBLIC_APP_URL` is the base URL.

## 7. Styling and UI
- **Framework**: Tailwind CSS.
- **Components**: Radix UI primitives via shadcn/ui.
- **Icons**: Lucide React.
- **Theme**: Dark mode is default (`class="dark"` in html).
- **Special**: `Squircle` component used for rounded corners.

## 8. Quality Checks
- Always run `npm run lint` and `npx tsc --noEmit` after changes.
- Ensure no new hydration errors are introduced.
- Verify RLS policies when modifying database queries.

## 9. Safe Change Rules
- **Database**: Do not modify migrations manually if they are already applied. Create new migrations for schema changes.
- **Env**: Use `NEXT_PUBLIC_` prefix only for client-exposed variables.
- **Auth**: Respect RLS. Do not use `service_role` key on client side.

## 10. Things to Avoid
- Do not use `pages/` router directory (except if strictly necessary for legacy reasons, currently none).
- Do not hardcode `http://localhost:3000`. Use `process.env.NEXT_PUBLIC_APP_URL`.
- Do not commit secrets or `.env` files.

## 11. Recommended Agent Workflow
1. Read `AGENTS.md` and `package.json`.
2. Locate the feature code in `src/app` or `src/components`.
3. Check `supabase/migrations` if database changes are needed.
4. Implement changes using existing patterns (e.g., `createClient`, `Squircle`).
5. Verify with lint and typecheck.
