alter table if exists public.onboarding_leads enable row level security;

revoke all on table public.onboarding_leads from anon;
revoke all on table public.onboarding_leads from authenticated;

drop policy if exists onboarding_leads_no_client_access on public.onboarding_leads;
create policy onboarding_leads_no_client_access
  on public.onboarding_leads
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

