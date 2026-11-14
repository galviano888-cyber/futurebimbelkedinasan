-- Constraint lama hanya mengizinkan SATUAN/BUNDLE/INTENSIF.
-- Perluas agar KELAS dan PRIVAT bisa disimpan.

begin;

alter table public.packages
  drop constraint if exists packages_product_type_check;

alter table public.packages
  add constraint packages_product_type_check
  check (product_type in ('SATUAN', 'BUNDLE', 'INTENSIF', 'KELAS', 'PRIVAT'));

notify pgrst, 'reload schema';

commit;
