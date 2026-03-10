do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'set_updated_at' and n.nspname = 'public'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

alter table public.admin_crypto_wallets
  add column if not exists notes text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

drop trigger if exists set_admin_crypto_wallets_updated_at on public.admin_crypto_wallets;
create trigger set_admin_crypto_wallets_updated_at
before update on public.admin_crypto_wallets
for each row execute function public.set_updated_at();
