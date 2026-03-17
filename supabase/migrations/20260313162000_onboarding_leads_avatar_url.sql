alter table if exists public.onboarding_leads
  add column if not exists avatar_url text;
