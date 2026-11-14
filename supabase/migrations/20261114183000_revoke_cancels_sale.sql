-- Cabut akses = batalkan penjualan; beri akses lagi = aktifkan kembali.
--
-- Sebelumnya transaksi tetap 'success' walau akses dicabut, sehingga grafik
-- omzet menyimpan angka yang sudah tidak berlaku.
--
-- Sekarang:
--   akses dicabut        -> transaksi jadi 'cancelled' (hilang dari omzet,
--                           tetap tersimpan sebagai jejak audit)
--   akses diberikan lagi -> transaksi 'cancelled' yang sama diaktifkan
--                           kembali, bukan membuat baris baru (tidak dobel)

begin;

-- ── 1. Izinkan status 'cancelled' ───────────────────────────────────────────
alter table public.transactions
  drop constraint if exists transactions_status_check;

alter table public.transactions
  add constraint transactions_status_check
  check (status in ('pending', 'verifying', 'success', 'failed', 'expired', 'cancelled'));

-- ── 2. Cabut akses: batalkan penjualan ─────────────────────────────────────
create or replace function public.release_package_seat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.packages
  set seats_taken = greatest(seats_taken - 1, 0)
  where id = old.package_id;

  -- Batalkan penjualan milik akses ini. Prioritaskan yang tertaut langsung,
  -- lalu jatuh ke pasangan user+paket bila tautannya kosong.
  update public.transactions
  set status = 'cancelled',
      updated_at = now()
  where status = 'success'
    and (
      (old.transaction_id is not null and id::text = old.transaction_id)
      or (user_id = old.user_id and package_id = old.package_id)
    );

  return old;
end;
$$;

revoke all on function public.release_package_seat() from public, anon, authenticated;

drop trigger if exists trg_release_package_seat on public.user_packages;
create trigger trg_release_package_seat
  after delete on public.user_packages
  for each row
  execute function public.release_package_seat();

-- ── 3. Beri akses: aktifkan kembali atau catat penjualan baru ──────────────
create or replace function public.close_fulfilled_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed integer := 0;
  v_reactivated integer := 0;
  v_price integer;
  v_tx_id uuid;
begin
  -- Permintaan siswa (pending/verifying) untuk paket ini ditutup jadi sukses.
  update public.transactions
  set status = 'success',
      updated_at = now()
  where user_id = new.user_id
    and package_id = new.package_id
    and status in ('pending', 'verifying');

  get diagnostics v_closed = row_count;

  if v_closed = 0 then
    -- Akses pernah diberikan lalu dicabut: aktifkan kembali penjualan yang sama.
    update public.transactions
    set status = 'success',
        updated_at = now()
    where id = (
      select t.id
      from public.transactions t
      where t.user_id = new.user_id
        and t.package_id = new.package_id
        and t.status = 'cancelled'
      order by t.created_at desc
      limit 1
    );

    get diagnostics v_reactivated = row_count;
  end if;

  if v_reactivated > 0 then
    update public.user_packages
    set transaction_id = (
      select t.id::text
      from public.transactions t
      where t.user_id = new.user_id
        and t.package_id = new.package_id
        and t.status = 'success'
      order by t.created_at desc
      limit 1
    )
    where id = new.id;

    return new;
  end if;

  -- Belum pernah ada penjualan: catat baru (admin memberi akses langsung).
  if v_closed = 0 and not exists (
    select 1 from public.transactions t
    where t.user_id = new.user_id
      and t.package_id = new.package_id
      and t.status = 'success'
  ) then
    select p.price into v_price
    from public.packages p
    where p.id = new.package_id;

    insert into public.transactions (
      user_id, package_id, amount, price_snapshot, status,
      payment_method, invoice_id, expiry_date
    )
    values (
      new.user_id,
      new.package_id,
      coalesce(v_price, 0),
      coalesce(v_price, 0),
      'success',
      'admin_grant',
      'GRANT-' || to_char(now(), 'YYYYMMDD') || '-' ||
        upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      null
    )
    returning id into v_tx_id;

    update public.user_packages
    set transaction_id = v_tx_id::text
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.close_fulfilled_requests() from public, anon, authenticated;

drop trigger if exists trg_close_fulfilled_requests on public.user_packages;
create trigger trg_close_fulfilled_requests
  after insert on public.user_packages
  for each row
  execute function public.close_fulfilled_requests();

notify pgrst, 'reload schema';

commit;
