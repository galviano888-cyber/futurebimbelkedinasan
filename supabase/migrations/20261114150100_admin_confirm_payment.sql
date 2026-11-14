-- Admin verification for manual bank transfers.
-- Confirms a transfer and opens package access in one atomic step.

begin;

create or replace function public.admin_confirm_payment(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.transactions%rowtype;
  v_had_package boolean;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengonfirmasi pembayaran';
  end if;

  select t.* into v_tx
  from public.transactions t
  where t.id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  if v_tx.status = 'success' then
    return;
  end if;

  if v_tx.status not in ('pending', 'verifying') then
    raise exception 'Status transaksi tidak dapat dikonfirmasi: %', v_tx.status;
  end if;

  select exists (
    select 1 from public.user_packages up
    where up.user_id = v_tx.user_id and up.package_id = v_tx.package_id
  ) into v_had_package;

  update public.transactions
  set status = 'success',
      payment_method = coalesce(payment_method, 'manual_transfer'),
      updated_at = now()
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
      'Pembayaran Dikonfirmasi',
      'Transfer kamu sudah diverifikasi admin. Akses paket kini terbuka di menu Paket Saya.',
      'success',
      false
    );
  end if;
end;
$$;

revoke all on function public.admin_confirm_payment(uuid) from public, anon;
grant execute on function public.admin_confirm_payment(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
