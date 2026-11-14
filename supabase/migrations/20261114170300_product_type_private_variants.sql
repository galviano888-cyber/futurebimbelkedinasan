-- Privat dipisah menjadi dua varian:
--   PRIVAT_SATUAN : 1 pertemuan
--   PRIVAT_PAKET  : beberapa pertemuan dalam satu paket
-- Keduanya tetap diberi akses dengan cara yang sama (user_packages).

begin;

alter table public.packages
  drop constraint if exists packages_product_type_check;

alter table public.packages
  add constraint packages_product_type_check
  check (product_type in (
    'SATUAN', 'BUNDLE', 'INTENSIF', 'KELAS',
    'PRIVAT', 'PRIVAT_SATUAN', 'PRIVAT_PAKET'
  ));

notify pgrst, 'reload schema';

commit;
