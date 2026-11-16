-- BUG: upload gambar soal gagal dengan "permission denied for function is_fbk_admin".
--
-- Penyebab: migrasi 20261104060000_lock_privileged_rpc.sql mencabut seluruh izin
-- pada is_fbk_admin() dari public, anon, dan authenticated. Berbeda dengan
-- is_admin(), fungsi is_fbk_admin() TIDAK diberikan kembali.
--
-- Padahal policy storage (bucket question-images / question-media) memanggil
-- is_fbk_admin() untuk memeriksa apakah pengguna berhak mengunggah. Akibatnya
-- admin yang login tetap ditolak saat upload gambar soal.
--
-- Perbaikan: berikan kembali izin eksekusi kepada authenticated (dan anon bila
-- policy baca publik juga memakainya). Fungsi ini hanya mengembalikan boolean,
-- jadi aman untuk dieksekusi; isinya tidak membocorkan data.

begin;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_fbk_admin'
  ) then
    execute 'grant execute on function public.is_fbk_admin() to authenticated, service_role';

    -- Beberapa policy pada bucket publik juga bisa dipanggil anon.
    execute 'grant execute on function public.is_fbk_admin() to anon';
  end if;
end $$;

-- Pastikan is_admin() juga tetap terbuka (dipakai RLS di banyak tempat).
grant execute on function public.is_admin() to anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
