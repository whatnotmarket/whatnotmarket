-- Internal identity onboarding accounts and sessions.

create table if not exists public.internal_identities (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  encrypted_recovery text not null,
  recovery_iv text not null,
  recovery_salt text not null,
  bio text,
  avatar_url text,
  is_seller boolean not null default false,
  x_handle text,
  created_at timestamptz not null default now(),
  constraint internal_identities_username_format
    check (username ~ '^[a-z0-9_-]{3,24}$')
);

create unique index if not exists internal_identities_username_lower_key
  on public.internal_identities (lower(username));

create table if not exists public.internal_identity_sessions (
  id uuid primary key default uuid_generate_v4(),
  identity_id uuid not null references public.internal_identities(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists internal_identity_sessions_identity_idx
  on public.internal_identity_sessions (identity_id, created_at desc);

create index if not exists internal_identity_sessions_expires_idx
  on public.internal_identity_sessions (expires_at);

alter table public.internal_identities enable row level security;
alter table public.internal_identity_sessions enable row level security;

drop policy if exists internal_identities_select_self on public.internal_identities;
create policy internal_identities_select_self
  on public.internal_identities
  for select
  using (auth.uid() = auth_user_id);

drop policy if exists internal_identity_sessions_select_self on public.internal_identity_sessions;
create policy internal_identity_sessions_select_self
  on public.internal_identity_sessions
  for select
  using (
    exists (
      select 1
      from public.internal_identities i
      where i.id = identity_id
        and i.auth_user_id = auth.uid()
    )
  );
