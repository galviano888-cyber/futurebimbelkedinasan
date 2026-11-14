-- Reuse an in-flight invoice that is already awaiting admin verification,
-- so a student cannot create a second order for the same package.

begin;

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

  -- Invoice yang masih menunggu pembayaran atau verifikasi dipakai ulang.
  select t.* into v_tx
  from public.transactions t
  where t.user_id = v_user
    and t.package_id = p_package_id
    and t.status in ('pending', 'verifying')
    and (t.expiry_date is null or t.expiry_date > now())
  order by t.created_at desc
  limit 1;

  if found then
    if v_tx.amount = v_price and coalesce(v_tx.price_snapshot, v_tx.amount) = v_price then
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

notify pgrst, 'reload schema';

commit;
