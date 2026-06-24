-- ============================================================
-- ADD COVER IMAGE URL TO PACKAGES TABLE
-- + STORAGE POLICY FOR MEDIA BUCKET
-- Future Bimbel Kedinasan
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom cover_image_url ke tabel packages
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2. Buat bucket media jika belum ada (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policy: siapapun yang authenticated boleh upload ke bucket media
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- 4. Policy: siapapun boleh baca/lihat file di bucket media (public)
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
CREATE POLICY "Public can read media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- 5. Policy: authenticated user boleh update file miliknya
DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
CREATE POLICY "Authenticated users can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');

-- 6. Policy: authenticated user boleh hapus file miliknya
DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;
CREATE POLICY "Authenticated users can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');

-- Verifikasi kolom berhasil ditambah
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'packages'
  AND column_name = 'cover_image_url';
