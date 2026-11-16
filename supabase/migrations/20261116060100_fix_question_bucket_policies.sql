-- TEMUAN KEAMANAN saat memperbaiki upload gambar soal:
--
-- Policy storage untuk bucket gambar soal terlalu longgar:
--
--   "Admin can upload" (question-images, INSERT, authenticated)
--     check: bucket_id = 'question-images'
--     -> TIDAK memeriksa apakah pengguna admin. Siapa pun yang login bisa
--        mengunggah gambar ke bucket ini.
--
--   "Admin upload media" (question-media, INSERT, public)
--     check: bucket_id = 'question-media' AND auth.role() = 'authenticated'
--     -> juga tidak memeriksa admin.
--
-- Selain itu is_fbk_admin() hanya memeriksa EMAIL hardcoded:
--   (auth.jwt() ->> 'email') IN ('admin.utama@...', 'admin.soal@...')
-- sehingga admin baru yang ditambahkan lewat app_metadata.role tidak dikenali.
--
-- Perbaikan:
--   1. is_fbk_admin() memeriksa app_metadata.role DAN email (kompatibel).
--   2. Semua policy tulis pada bucket gambar mewajibkan is_fbk_admin().

begin;

-- ── 1. is_fbk_admin: kenali role admin, bukan hanya email ─────────────────
create or replace function public.is_fbk_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Jalur utama: role admin di app_metadata (tidak bisa diubah pengguna).
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' then
    return true;
  end if;

  -- Cadangan: email admin yang sudah dikenal.
  return coalesce(
    (auth.jwt() ->> 'email') in ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com'),
    false
  );
end;
$$;

revoke all on function public.is_fbk_admin() from public;
grant execute on function public.is_fbk_admin() to anon, authenticated, service_role;

-- ── 2. Policy tulis bucket gambar: wajib admin ────────────────────────────
-- question-images
drop policy if exists "Admin can upload 42yurj_0" on storage.objects;
drop policy if exists "admin_upload_question_images" on storage.objects;

create policy "admin_upload_question_images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'question-images' and public.is_fbk_admin());

-- question-media
drop policy if exists "Admin upload media" on storage.objects;
drop policy if exists "admin_upload_question_media" on storage.objects;

create policy "admin_upload_question_media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'question-media' and public.is_fbk_admin());

-- Policy hapus/ubah pada kedua bucket juga dibatasi admin.
drop policy if exists "admin_manage_question_objects" on storage.objects;

create policy "admin_manage_question_objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('question-images', 'question-media') and public.is_fbk_admin()
  );

drop policy if exists "admin_delete_question_objects" on storage.objects;

create policy "admin_delete_question_objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('question-images', 'question-media') and public.is_fbk_admin()
  );

notify pgrst, 'reload schema';

commit;
