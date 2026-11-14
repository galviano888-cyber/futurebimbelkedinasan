-- Permintaan lewat WhatsApp ditolak bila kursi kelas sudah penuh.
-- Kursi tetap baru terisi saat admin memberi akses, bukan saat chat.

begin;

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
  v_tx public.transactions%rowtype;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select p.price, p.quota, p.seats_taken
  into v_price, v_quota, v_taken
  from public.packages p
  where p.id = p_package_id
    and p.is_active = true;

  if v_price is null then
    raise exception 'Paket tidak ditemukan atau tidak aktif';
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

  -- Permintaan lama yang sudah lewat 24 jam ditutup.
  update public.transactions t
  set status = 'expired', updated_at = now()
  where t.user_id = v_user
    and t.package_id = p_package_id
    and t.status in ('pending', 'verifying')
    and t.expiry_date is not null
    and t.expiry_date <= now();

  -- Masih dalam masa tunggu: pakai permintaan yang sama.
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

notify pgrst, 'reload schema';

commit;
