-- Bersihkan RPC alur invoice yang sudah tidak dipakai.
-- Alur sekarang: request_package_access() + admin_confirm_payment().

begin;

drop function if exists public.mark_payment_submitted(uuid);
drop function if exists public.create_order(uuid);

notify pgrst, 'reload schema';

commit;
