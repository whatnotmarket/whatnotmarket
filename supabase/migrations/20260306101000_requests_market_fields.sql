-- Additional request fields used by marketplace listing UI.

alter table public.requests
  add column if not exists payment_method text,
  add column if not exists delivery_time text;

create index if not exists requests_payment_method_idx on public.requests (payment_method);

