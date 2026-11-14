-- Manual bank transfer payment flow.
-- QRIS/Pakasir is paused ("coming soon"), so orders are recorded as manual
-- transfers and the student can flag a transfer as submitted for admin review.

begin;

-- 1. New orders are manual transfers.
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
      -- Pastikan order lama juga tercatat sebagai transfer manual.
      update public.transactions
      set payment_method = 'manual_transfer'
      where id = v_tx.id
        and coalesce(payment_method, '') <> 'manual_transfer';

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
    'manual_transfer'
  )
  returning * into v_tx;

  return query select v_tx.id, v_tx.invoice_id, v_tx.amount;
end;
$$;

revoke all on function public.create_order(uuid) from public, anon;
grant execute on function public.create_order(uuid) to authenticated;

-- 2. Student marks a manual transfer as submitted, so it lands in the admin
--    verification queue. Only touches their own pending order.
create or replace function public.mark_payment_submitted(p_transaction_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tx public.transactions%rowtype;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select t.* into v_tx
  from public.transactions t
  where t.id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  if v_tx.user_id <> v_user then
    raise exception 'Tidak berhak atas transaksi ini';
  end if;

  if v_tx.status = 'verifying' then
    return 'verifying';
  end if;

  if v_tx.status <> 'pending' then
    raise exception 'Status transaksi tidak dapat diubah: %', v_tx.status;
  end if;

  if v_tx.expiry_date is not null and v_tx.expiry_date <= now() then
    update public.transactions
    set status = 'expired', updated_at = now()
    where id = v_tx.id;
    raise exception 'Invoice sudah kadaluarsa';
  end if;

  update public.transactions
  set status = 'verifying',
      updated_at = now()
  where id = v_tx.id;

  insert into public.notifications (user_id, title, message, type, read)
  values (
    v_tx.user_id,
    'Menunggu Verifikasi',
    'Terima kasih! Bukti transfer kamu sedang diverifikasi admin. Akses paket akan terbuka otomatis setelah dikonfirmasi.',
    'info',
    false
  );

  return 'verifying';
end;
$$;

revoke all on function public.mark_payment_submitted(uuid) from public, anon;
grant execute on function public.mark_payment_submitted(uuid) to authenticated;

commit;
