-- Payment hardening: price snapshot, server-side order creation, idempotent grant.
-- Safe to run more than once.

begin;

-- 1. Schema additions
alter table public.transactions
  add column if not exists price_snapshot integer;

alter table public.transactions
  alter column price_snapshot set default 0;

update public.transactions t
set price_snapshot = p.price
from public.packages p
where t.package_id = p.id
  and t.price_snapshot is null;

update public.transactions
set price_snapshot = amount
where price_snapshot is null;

alter table public.user_packages
  add column if not exists activated_at timestamptz default now();

alter table public.notifications
  add column if not exists read boolean default false;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from public, anon, authenticated;
grant all on public.payment_events to service_role;

create index if not exists idx_payment_events_transaction
  on public.payment_events(transaction_id, created_at desc);

-- 2. Transactions can only be created/updated by server functions.
revoke insert, update on public.transactions from anon, authenticated;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'transactions'
  loop
    execute format('drop policy if exists %I on public.transactions', r.policyname);
  end loop;
end $$;

create policy "Users view own transactions"
  on public.transactions for select to authenticated
  using (auth.uid() = user_id);

create policy "Admin manage all transactions"
  on public.transactions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Free packages are claimed through a function, not raw inserts.
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'user_packages'
  loop
    execute format('drop policy if exists %I on public.user_packages', r.policyname);
  end loop;
end $$;

create policy "Users view own packages"
  on public.user_packages for select to authenticated
  using (auth.uid() = user_id);

create policy "Admin manage all user packages"
  on public.user_packages for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Create an order from the package price stored in the database.
create or replace function public.create_order(p_package_id uuid)
returns table(transaction_id uuid, invoice_id text, amount integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
  v_tx public.transactions%rowtype;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select p.price into v_price
  from public.packages p
  where p.id = p_package_id
    and p.is_active = true;

  if v_price is null then
    raise exception 'Paket tidak ditemukan atau tidak aktif';
  end if;

  if v_price = 0 then
    raise exception 'Paket gratis harus diklaim melalui claim_free_package';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text), hashtext(p_package_id::text));

  if exists (
    select 1 from public.user_packages up
    where up.user_id = v_user and up.package_id = p_package_id
  ) then
    raise exception 'Anda sudah memiliki paket ini';
  end if;

  select t.* into v_tx
  from public.transactions t
  where t.user_id = v_user
    and t.package_id = p_package_id
    and t.status = 'pending'
    and (t.expiry_date is null or t.expiry_date > now())
  order by t.created_at desc
  limit 1;

  if found then
    -- Reuse only a pending order whose amount matches the current price.
    if v_tx.amount = v_price and coalesce(v_tx.price_snapshot, v_tx.amount) = v_price then
      return query select v_tx.id, v_tx.invoice_id, v_tx.amount;
      return;
    end if;

    update public.transactions
    set status = 'expired', updated_at = now()
    where id = v_tx.id;
  end if;

  insert into public.transactions (
    id, user_id, package_id, amount, price_snapshot, status,
    invoice_id, expiry_date, payment_method
  )
  values (
    gen_random_uuid(),
    v_user,
    p_package_id,
    v_price,
    v_price,
    'pending',
    'INV-SKD-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    now() + interval '48 hours',
    'pakasir_qris'
  )
  returning * into v_tx;

  return query select v_tx.id, v_tx.invoice_id, v_tx.amount;
end;
$$;

revoke all on function public.create_order(uuid) from public;
grant execute on function public.create_order(uuid) to authenticated;

-- 5. Free package claim.
create or replace function public.claim_free_package(p_package_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select p.price into v_price
  from public.packages p
  where p.id = p_package_id and p.is_active = true;

  if v_price is null then
    raise exception 'Paket tidak ditemukan atau tidak aktif';
  end if;

  if v_price <> 0 then
    raise exception 'Paket ini tidak gratis';
  end if;

  insert into public.user_packages (user_id, package_id, activated_at)
  values (v_user, p_package_id, now())
  on conflict (user_id, package_id) do nothing;
end;
$$;

revoke all on function public.claim_free_package(uuid) from public;
grant execute on function public.claim_free_package(uuid) to authenticated;

-- 6. Grant access after a verified payment. Service role only.
create or replace function public.grant_package(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.transactions%rowtype;
  v_had_package boolean;
begin
  select t.* into v_tx
  from public.transactions t
  where t.id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  if v_tx.status not in ('pending', 'verifying', 'success') then
    raise exception 'Status transaksi tidak valid: %', v_tx.status;
  end if;

  select exists (
    select 1 from public.user_packages up
    where up.user_id = v_tx.user_id and up.package_id = v_tx.package_id
  ) into v_had_package;

  update public.transactions
  set status = 'success', updated_at = now()
  where id = v_tx.id;

  insert into public.user_packages (user_id, package_id, transaction_id, activated_at)
  values (v_tx.user_id, v_tx.package_id, v_tx.id, now())
  on conflict (user_id, package_id) do update
    set transaction_id = excluded.transaction_id,
        activated_at = coalesce(public.user_packages.activated_at, excluded.activated_at);

  if not v_had_package then
    insert into public.notifications (user_id, title, message, type, read)
    values (
      v_tx.user_id,
      'Pembayaran Berhasil!',
      'Pembayaran kamu sudah dikonfirmasi. Akses paket sudah terbuka.',
      'success',
      false
    );
  end if;
end;
$$;

revoke all on function public.grant_package(uuid) from public;
grant execute on function public.grant_package(uuid) to service_role;

commit;
