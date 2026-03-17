-- Centralized content moderation schema (public/semi-public content only).
-- Explicitly excludes private inbox/DM moderation in application logic.

create extension if not exists "uuid-ossp";

create table if not exists public.moderation_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  target_type text not null,
  entity_id text,
  actor_id uuid references public.profiles(id) on delete set null,
  decision text not null check (decision in ('allow', 'flag', 'review', 'block')),
  severity text not null check (severity in ('none', 'low', 'medium', 'high', 'critical')),
  score integer not null default 0 check (score >= 0 and score <= 100),
  reason_codes text[] not null default '{}'::text[],
  matched_rules text[] not null default '{}'::text[],
  route text,
  skipped_because_inbox boolean not null default false,
  original_excerpt text,
  sanitized_excerpt text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.moderation_reviews_queue (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  target_type text not null,
  entity_id text,
  actor_id uuid references public.profiles(id) on delete set null,
  route text,
  score integer not null default 0 check (score >= 0 and score <= 100),
  severity text not null check (severity in ('none', 'low', 'medium', 'high', 'critical')),
  reason_codes text[] not null default '{}'::text[],
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.user_reviews (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  content text not null,
  status text not null default 'published' check (status in ('published', 'pending_review', 'rejected')),
  moderation_reason_codes text[] not null default '{}'::text[]
);

create table if not exists public.public_comments (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  content text not null,
  status text not null default 'published' check (status in ('published', 'pending_review', 'rejected')),
  moderation_reason_codes text[] not null default '{}'::text[]
);

create table if not exists public.public_form_submissions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  form_key text not null,
  title text,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'pending_review', 'rejected')),
  moderation_reason_codes text[] not null default '{}'::text[]
);

create index if not exists moderation_events_created_at_idx
  on public.moderation_events (created_at desc);
create index if not exists moderation_events_target_idx
  on public.moderation_events (target_type, entity_id, created_at desc);
create index if not exists moderation_events_actor_idx
  on public.moderation_events (actor_id, created_at desc);
create index if not exists moderation_events_decision_idx
  on public.moderation_events (decision, severity, created_at desc);

create index if not exists moderation_reviews_queue_status_idx
  on public.moderation_reviews_queue (status, created_at desc);
create index if not exists moderation_reviews_queue_target_idx
  on public.moderation_reviews_queue (target_type, entity_id, created_at desc);

create index if not exists user_reviews_reviewee_idx
  on public.user_reviews (reviewee_id, created_at desc);
create index if not exists user_reviews_status_idx
  on public.user_reviews (status, created_at desc);

create index if not exists public_comments_entity_idx
  on public.public_comments (entity_type, entity_id, created_at desc);
create index if not exists public_comments_status_idx
  on public.public_comments (status, created_at desc);

create index if not exists public_form_submissions_status_idx
  on public.public_form_submissions (status, created_at desc);
create index if not exists public_form_submissions_form_key_idx
  on public.public_form_submissions (form_key, created_at desc);

drop trigger if exists set_user_reviews_updated_at on public.user_reviews;
create trigger set_user_reviews_updated_at
before update on public.user_reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_public_comments_updated_at on public.public_comments;
create trigger set_public_comments_updated_at
before update on public.public_comments
for each row execute function public.set_updated_at();

alter table public.moderation_events enable row level security;
alter table public.moderation_reviews_queue enable row level security;
alter table public.user_reviews enable row level security;
alter table public.public_comments enable row level security;
alter table public.public_form_submissions enable row level security;

drop policy if exists moderation_events_admin_select on public.moderation_events;
create policy moderation_events_admin_select
  on public.moderation_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists moderation_reviews_queue_admin_all on public.moderation_reviews_queue;
create policy moderation_reviews_queue_admin_all
  on public.moderation_reviews_queue for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists user_reviews_select_public on public.user_reviews;
create policy user_reviews_select_public
  on public.user_reviews for select
  using (
    status = 'published'
    or reviewer_id = auth.uid()
    or reviewee_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists user_reviews_insert_self on public.user_reviews;
create policy user_reviews_insert_self
  on public.user_reviews for insert
  with check (reviewer_id = auth.uid() and reviewer_id <> reviewee_id);

drop policy if exists public_comments_select_public on public.public_comments;
create policy public_comments_select_public
  on public.public_comments for select
  using (
    status = 'published'
    or author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists public_comments_insert_self on public.public_comments;
create policy public_comments_insert_self
  on public.public_comments for insert
  with check (author_id = auth.uid());

drop policy if exists public_form_submissions_insert_self on public.public_form_submissions;
create policy public_form_submissions_insert_self
  on public.public_form_submissions for insert
  with check (actor_id = auth.uid());

drop policy if exists public_form_submissions_select_self_or_admin on public.public_form_submissions;
create policy public_form_submissions_select_self_or_admin
  on public.public_form_submissions for select
  using (
    actor_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

revoke all on public.moderation_events from anon, authenticated;
revoke all on public.moderation_reviews_queue from anon, authenticated;
