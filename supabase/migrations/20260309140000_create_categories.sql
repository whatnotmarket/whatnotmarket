-- Create categories table
create table if not exists public.categories (
  id text primary key, -- slug (e.g., 'gaming', 'crypto')
  name text not null,
  icon text not null, -- Lucide icon name or emoji or url
  is_verified boolean default false, -- true for admin created, false for user suggestions
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

-- Policies
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

create policy "Admins can insert/update/delete categories"
  on public.categories for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can suggest categories"
  on public.categories for insert
  with check (
    auth.uid() = created_by
    and is_verified = false
  );

-- Seed initial categories
insert into public.categories (id, name, icon, is_verified) values
('accounts', 'Accounts', 'CheckCircle', true),
('gaming', 'Gaming', 'Zap', true),
('telco', 'Telco', 'Smartphone', true),
('software', 'Software', 'Monitor', true),
('skins', 'Skins', 'Sparkles', true),
('crypto', 'Crypto', 'Globe', true)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  is_verified = excluded.is_verified;
