# OpenlyMarket

OpenlyMarket is a request-driven marketplace built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS 4
- Radix UI / shadcn components

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Run the app:

```bash
npm run dev
```

The default development command uses a custom launcher in `scripts/dev/dev.mjs`.

## Scripts

- `npm run dev` - start Next.js dev server (webpack mode)
- `npm run dev:turbo` - start Next.js dev server (turbo)
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run test:security` - run security-focused Node tests in `tests/security`

## Auth

Authentication is implemented with Supabase Auth. Available providers and flows depend on your Supabase project configuration and environment variables.

## Notes

- Root homepage routes now resolve to production-safe marketplace views instead of draft dev pages.
- See `CONTRIBUTING.md` for contribution workflow.
