-- Perbaikan trigger sinkronisasi status paket dari 20261115060000.
--
-- Bug: saat admin hanya mengubah is_active, trigger menimpa nilai baru
-- dengan hasil turunan sales_status yang lama, sehingga is_active = true
-- berakhir sebagai HIDDEN.
--
-- Perbaikan: tentukan dulu MANA yang berubah (sales_status atau is_active),
-- baru turunkan nilai pasangannya.

begin;

create or replace function public.sync_package_active_flag()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    -- Admin mengubah sales_status secara eksplisit: itu yang menang.
    if new.sales_status is distinct from old.sales_status then
      new.is_active := (new.sales_status is distinct from 'HIDDEN');
      return new;
    end if;

    -- Admin mengubah is_active secara eksplisit: turunkan statusnya.
    if new.is_active is distinct from old.is_active then
      new.sales_status := case when new.is_active then 'OPEN' else 'HIDDEN' end;
      return new;
    end if;

    -- Tidak ada yang berubah: pastikan tetap konsisten.
    new.is_active := (new.sales_status is distinct from 'HIDDEN');
    return new;
  end if;

  -- INSERT: hormati is_active = false sebagai paket tersembunyi.
  if new.is_active is false then
    new.sales_status := 'HIDDEN';
  else
    new.is_active := (new.sales_status is distinct from 'HIDDEN');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_package_active_flag on public.packages;
create trigger trg_sync_package_active_flag
  before insert or update on public.packages
  for each row
  execute function public.sync_package_active_flag();

-- Rapikan baris yang mungkin sudah tidak konsisten.
update public.packages
set is_active = (sales_status is distinct from 'HIDDEN')
where is_active is distinct from (sales_status is distinct from 'HIDDEN');

notify pgrst, 'reload schema';

commit;
