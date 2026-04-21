-- ==========================================================
-- EMERGENCY FIX: REPAIR USER PACKAGE VISIBILITY (V2)
-- ==========================================================

-- 1. Pastikan RLS diaktifkan pada semua tabel terkait
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_contents ENABLE ROW LEVEL SECURITY;

-- 2. Bersihkan policy lama yang mungkin bermasalah (Pembersihan Total)
DROP POLICY IF EXISTS "Users view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view their own packages" ON public.user_packages;
DROP POLICY IF EXISTS "Public view packages" ON public.packages;
DROP POLICY IF EXISTS "Public view contents" ON public.package_contents;
DROP POLICY IF EXISTS "Admin manage user packages" ON public.user_packages;
DROP POLICY IF EXISTS "Admin manage packages" ON public.packages;
DROP POLICY IF EXISTS "Admin manage contents" ON public.package_contents;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;

-- 3. Terapkan policy baru yang lebih stabil

-- PROFILES: User bisa melihat profilnya sendiri
CREATE POLICY "Users view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- USER_PACKAGES: User bisa melihat paket miliknya sendiri
CREATE POLICY "Users view their own packages" 
ON public.user_packages 
FOR SELECT 
USING (auth.uid() = user_id);

-- PACKAGES & CONTENTS: Terbuka untuk umum (Read Only) agar join query lancar
CREATE POLICY "Public view packages" 
ON public.packages 
FOR SELECT 
USING (true);

CREATE POLICY "Public view contents" 
ON public.package_contents 
FOR SELECT 
USING (true);

-- 4. Fix Admin Manage (Pastikan admin tetap bisa mengelola segalanya)
-- Gunakan email admin yang terdaftar di sistem
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com')
);

CREATE POLICY "Admin manage packages" ON public.packages FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com')
);

CREATE POLICY "Admin manage user packages" ON public.user_packages FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com')
);

CREATE POLICY "Admin manage contents" ON public.package_contents FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com')
);

-- 6. Reload Schema
NOTIFY pgrst, 'reload schema';

-- DIAGNOSTIC QUERY (Hanya jalankan di editor SQL)
-- SELECT p.id, p.email, count(up.id) as pkg_count 
-- FROM profiles p 
-- LEFT JOIN user_packages up ON p.id = up.user_id 
-- GROUP BY p.id, p.email;
