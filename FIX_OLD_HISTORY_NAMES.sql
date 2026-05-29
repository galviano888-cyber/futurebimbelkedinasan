-- ==========================================================
-- UPDATE NAMA RIWAYAT TRYOUT LAMA
-- Mengubah "SKD Silver Bundle" menjadi "SKD Silver Bundle - Tryout SKD 1"
-- ==========================================================

UPDATE public.tryout_results
SET package_name = p.title || ' - ' || tp.name
FROM public.packages p, public.tryout_packages tp
WHERE public.tryout_results.package_id = p.id 
  AND public.tryout_results.tryout_id = tp.id;

-- Reload Schema untuk mereset cache view
NOTIFY pgrst, 'reload schema';
