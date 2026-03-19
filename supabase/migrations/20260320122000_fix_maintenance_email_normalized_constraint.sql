-- Provider-aware email normalization can differ from lower(trim(email)).
-- Keep canonical email normalized, lowercase and trimmed, but decouple from raw email.

alter table if exists public.maintenance_early_access_leads
  drop constraint if exists maintenance_early_access_email_normalized_check;

alter table if exists public.maintenance_early_access_leads
  add constraint maintenance_early_access_email_normalized_check
  check (
    length(trim(email_normalized)) > 3
    and email_normalized = lower(trim(email_normalized))
    and position('@' in email_normalized) > 1
  );
