-- 1. Hapus sisa transaksi Pakasir yang menggantung.
-- 2. Setiap pemberian paket dicatat sebagai penjualan, supaya grafik pemasukan
--    di panel admin bertambah walaupun admin memberi akses langsung
--    (tanpa siswa chat lebih dulu).

begin;

-- ── 1. Bersihkan transaksi Pakasir ──────────────────────────────────────────
-- user_packages.transaction_id bertipe TEXT di database live (drift dari
-- schema_reconcile yang menulis uuid), jadi perbandingan dilakukan sebagai text.
-- Tautannya dilepas dulu sebelum baris transaksi dihapus (FK tanpa ON DELETE).
update public.user_packages up
set transaction_id = null
where up.transaction_id in (
  select t.id::text from public.transactions t where t.payment_method = 'pakasir_qris'
);

delete from public.transactions
where payment_method = 'pakasir_qris';

-- ── 2. Catat pemberian paket sebagai penjualan ──────────────────────────────
create or replace function public.close_fulfilled_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed integer := 0;
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

  -- Tidak ada permintaan yang ditutup: admin memberi akses langsung.
  -- Catat sebagai penjualan baru, kecuali sudah pernah tercatat sukses
  -- (misal akses dicabut lalu diberikan lagi — jangan dihitung dua kali).
  if v_closed = 0 then
    if not exists (
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
  end if;

  return new;
end;
$$;

revoke all on function public.close_fulfilled_requests() from public, anon, authenticated;

-- Trigger sudah ada dari migrasi 20261114160000; pastikan tetap terpasang.
drop trigger if exists trg_close_fulfilled_requests on public.user_packages;
create trigger trg_close_fulfilled_requests
  after insert on public.user_packages
  for each row
  execute function public.close_fulfilled_requests();

notify pgrst, 'reload schema';

commit;
