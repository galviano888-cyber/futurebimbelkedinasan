-- Perbaikan: trigger generate_referral_code masih berjalan pada INSERT
-- ke public.profiles, padahal kolom referral_code/referral_points sudah
-- dihapus. Akibatnya setiap pendaftaran siswa baru GAGAL dengan
-- "Database error creating new user".
--
-- Trigger dan fungsinya dihapus karena fitur referral memang dihentikan.

begin;

drop trigger if exists trigger_generate_referral_code on public.profiles;
drop function if exists public.generate_referral_code() cascade;

notify pgrst, 'reload schema';

commit;
