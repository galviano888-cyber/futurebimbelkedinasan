-- ==========================================================
-- ADD PROFILE VISIBILITY SETTING
-- ==========================================================

-- 1. Tambah kolom is_public ke tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Update View fair_package_leaderboard agar menghormati privasi
-- Siswa yang is_public = false akan muncul sebagai "Siswa Privat"
CREATE OR REPLACE VIEW public.fair_package_leaderboard AS
SELECT DISTINCT ON (l.user_id, COALESCE(l.tryout_id::text, l.package_name))
    l.id, 
    l.user_id, 
    l.package_id, 
    l.tryout_id, 
    l.package_name, 
    l.twk, l.tiu, l.tkp, 
    l.twk_correct, l.tiu_correct, l.tkp_correct,
    l.total, l.answers, l.score_details, l.date, l.created_at,
    CASE 
        WHEN p.is_public = false THEN 'Siswa Privat'
        ELSE COALESCE(p.full_name, 'Siswa FBK')
    END as full_name,
    CASE 
        WHEN p.is_public = false THEN 'Rahasia'
        ELSE COALESCE(p.school, '-')
    END as school
FROM public.tryout_results l
LEFT JOIN public.profiles p ON l.user_id = p.id
ORDER BY l.user_id, COALESCE(l.tryout_id::text, l.package_name), l.created_at ASC;

-- 3. Update View leaderboard_averages juga
CREATE OR REPLACE VIEW public.leaderboard_averages AS
SELECT 
    l.user_id, 
    MAX(l.full_name) as full_name, 
    MAX(l.school) as school,
    ROUND(AVG(l.total)) as avg_total,
    ROUND(AVG(l.twk)) as avg_twk,
    ROUND(AVG(l.tiu)) as avg_tiu,
    ROUND(AVG(l.tkp)) as avg_tkp,
    COUNT(l.id) as packages_completed
FROM public.fair_package_leaderboard l
GROUP BY l.user_id;

-- Reload Schema
NOTIFY pgrst, 'reload schema';
