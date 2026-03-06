create table if not exists public.seller_invite_code_claims (
  code text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  claimed_at timestamptz not null default now()
);

create unique index if not exists seller_invite_code_claims_user_id_idx
  on public.seller_invite_code_claims (user_id);

alter table public.seller_invite_code_claims enable row level security;

drop policy if exists seller_invite_code_claims_admin_read on public.seller_invite_code_claims;
create policy seller_invite_code_claims_admin_read
  on public.seller_invite_code_claims
  for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

