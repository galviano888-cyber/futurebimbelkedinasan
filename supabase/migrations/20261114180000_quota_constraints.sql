-- T-01: batasi kuota paket kelas di level database.
--
-- Sebelumnya batas "maks 5 orang" hanya dijaga UI dan default trigger,
-- sehingga `update packages set quota = 99` lewat SQL tetap lolos.
-- Sekarang database menolak kuota di luar 1..5.

begin;

-- 1. Rapikan data yang sudah terlanjur di luar batas.
update public.packages
set quota = 5
where quota is not null and quota > 5;

update public.packages
set quota = 1
where quota is not null and quota < 1;

-- 2. Paket non-kelas tidak boleh punya kuota.
update public.packages
set quota = null
where product_type is distinct from 'KELAS' and quota is not null;

-- 3. Constraint yang mengikat.
alter table public.packages
  drop constraint if exists packages_quota_range_check;

alter table public.packages
  add constraint packages_quota_range_check
  check (quota is null or (quota >= 1 and quota <= 5));

-- 4. Hanya paket KELAS yang boleh berkuota.
alter table public.packages
  drop constraint if exists packages_quota_only_kelas_check;

alter table public.packages
  add constraint packages_quota_only_kelas_check
  check (quota is null or product_type = 'KELAS');

-- 5. Kursi tidak boleh melebihi kuota.
alter table public.packages
  drop constraint if exists packages_seats_within_quota_check;

alter table public.packages
  add constraint packages_seats_within_quota_check
  check (quota is null or seats_taken <= quota);

-- 6. Kursi tidak boleh negatif.
alter table public.packages
  drop constraint if exists packages_seats_non_negative_check;

alter table public.packages
  add constraint packages_seats_non_negative_check
  check (seats_taken >= 0);

notify pgrst, 'reload schema';

commit;
