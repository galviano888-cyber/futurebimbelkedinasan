-- Tiga status penjualan paket:
--   OPEN   : tampil di katalog siswa dan bisa dibeli (perilaku sekarang)
--   CLOSED : tetap tampil di katalog, tetapi tidak bisa dibeli / diklaim.
--            Dipakai untuk menutup pendaftaran tanpa menghapus paket.
--   HIDDEN : disembunyikan dari katalog siswa, data tetap tersimpan.
--
-- is_active tetap dipertahankan karena dipakai policy RLS dan banyak query:
--   HIDDEN -> is_active = false (tidak terlihat siswa)
--   OPEN / CLOSED -> is_active = true (terlihat siswa)
--
-- Siswa yang SUDAH punya akses tetap bisa membuka paket yang ditutup.
-- Menutup pendaftaran hanya menghentikan pembelian baru.

begin;

-- 1. Kolom status.
alter table public.packages
  add column if not exists sales_status text not null default 'OPEN';

alter table public.packages
  drop constraint if exists packages_sales_status_check;

alter table public.packages
  add constraint packages_sales_status_check
  check (sales_status in ('OPEN', 'CLOSED', 'HIDDEN'));

-- 2. Samakan data lama dengan is_active yang sudah ada.
update public.packages
set sales_status = case when is_active then 'OPEN' else 'HIDDEN' end
where sales_status is null or sales_status not in ('OPEN', 'CLOSED', 'HIDDEN');

-- 3. Jaga is_active tetap sinkron dengan sales_status.
create or replace function public.sync_package_active_flag()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- sales_status adalah sumber kebenaran.
  new.is_active := (new.sales_status is distinct from 'HIDDEN');

  -- Menulis is_active langsung juga ikut menyesuaikan status.
  if new.is_active is false and new.sales_status <> 'HIDDEN' then
    new.sales_status := 'HIDDEN';
  elsif new.is_active is true and new.sales_status = 'HIDDEN' then
    new.sales_status := 'OPEN';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_package_active_flag on public.packages;
create trigger trg_sync_package_active_flag
  before insert or update on public.packages
  for each row
  execute function public.sync_package_active_flag();

-- Pastikan baris yang sudah ada konsisten setelah trigger dipasang.
update public.packages
set is_active = (sales_status is distinct from 'HIDDEN')
where is_active is distinct from (sales_status is distinct from 'HIDDEN');

-- 4. Permintaan paket (chat WhatsApp) ditolak bila pendaftaran ditutup.
create or replace function public.request_package_access(p_package_id uuid)
returns table(request_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
  v_quota integer;
  v_taken integer;
  v_status text;
  v_tx public.transactions%rowtype;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select p.price, p.quota, p.seats_taken, p.sales_status
  into v_price, v_quota, v_taken, v_status
  from public.packages p
  where p.id = p_package_id
    and p.is_active = true;

  if v_price is null then
    raise exception 'Paket tidak ditemukan atau tidak aktif';
  end if;

  if v_status = 'CLOSED' then
    raise exception 'Pendaftaran paket ini sudah ditutup'
      using errcode = 'check_violation';
  end if;

  if v_price = 0 then
    raise exception 'Paket gratis harus diklaim melalui claim_free_package';
  end if;

  if v_quota is not null and coalesce(v_taken, 0) >= v_quota then
    raise exception 'Kuota kelas ini sudah penuh (% dari %)', coalesce(v_taken, 0), v_quota
      using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text), hashtext(p_package_id::text));

  if exists (
    select 1 from public.user_packages up
    where up.user_id = v_user and up.package_id = p_package_id
  ) then
    raise exception 'Anda sudah memiliki paket ini';
  end if;

  update public.transactions t
  set status = 'expired', updated_at = now()
  where t.user_id = v_user
    and t.package_id = p_package_id
    and t.status in ('pending', 'verifying')
    and t.expiry_date is not null
    and t.expiry_date <= now();

  select t.* into v_tx
  from public.transactions t
  where t.user_id = v_user
    and t.package_id = p_package_id
    and t.status in ('pending', 'verifying')
    and (t.expiry_date is null or t.expiry_date > now())
  order by t.created_at desc
  limit 1;

  if found then
    return query select v_tx.id, v_tx.expiry_date;
    return;
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
    'REQ-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    now() + interval '24 hours',
    'manual_transfer'
  )
  returning * into v_tx;

  return query select v_tx.id, v_tx.expiry_date;
end;
$$;

revoke all on function public.request_package_access(uuid) from public, anon;
grant execute on function public.request_package_access(uuid) to authenticated;

-- 5. Klaim paket gratis juga ditolak bila ditutup.
create or replace function public.claim_free_package(p_package_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
  v_status text;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select p.price, p.sales_status into v_price, v_status
  from public.packages p
  where p.id = p_package_id and p.is_active = true;

  if v_price is null then
    raise exception 'Paket tidak ditemukan atau tidak aktif';
  end if;

  if v_status = 'CLOSED' then
    raise exception 'Pendaftaran paket ini sudah ditutup'
      using errcode = 'check_violation';
  end if;

  if v_price <> 0 then
    raise exception 'Paket ini tidak gratis';
  end if;

  insert into public.user_packages (user_id, package_id, activated_at)
  values (v_user, p_package_id, now())
  on conflict (user_id, package_id) do nothing;
end;
$$;

revoke all on function public.claim_free_package(uuid) from public, anon;
grant execute on function public.claim_free_package(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
