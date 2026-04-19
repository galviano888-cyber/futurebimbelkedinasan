-- ==========================================================
-- FBK FAIR RANKING SYSTEM (First-Attempt-Only Policy)
-- Script ini memastikan peringkat nasional murni berdasarkan
-- percobaan pertama siswa untuk setiap paket soal.
-- ==========================================================

-- 1. VIEW: fair_package_leaderboard
-- Mengambil percobaan pertama setiap user untuk setiap tryout_id unik.
DROP VIEW IF EXISTS public.leaderboard_averages CASCADE;
DROP VIEW IF EXISTS public.fair_package_leaderboard CASCADE;

CREATE OR REPLACE VIEW public.fair_package_leaderboard AS
SELECT DISTINCT ON (tr.user_id, tr.package_id, tr.tryout_id, tr.package_name)
    tr.id,
    tr.user_id,
    tr.package_id,
    tr.tryout_id,
    tr.twk,
    tr.tiu,
    tr.tkp,
    tr.total,
    tr.date,
    p.full_name,
    COALESCE(tp.name, tr.package_name, 'Paket Anonim') as package_name
FROM 
    public.tryout_results tr
JOIN 
    public.profiles p ON tr.user_id = p.id
LEFT JOIN
    public.tryout_packages tp ON tr.package_id = tp.id
WHERE
    tr.total > 0
ORDER BY 
    tr.user_id, tr.package_id, tr.tryout_id, tr.package_name, tr.date ASC;

-- 2. VIEW: leaderboard_averages
-- Mengagregasi skor rata-rata dari semua "Percobaan Pertama" yang sah.
CREATE OR REPLACE VIEW public.leaderboard_averages AS
SELECT 
    user_id,
    full_name,
    ROUND(AVG(twk)) as avg_twk,
    ROUND(AVG(tiu)) as avg_tiu,
    ROUND(AVG(tkp)) as avg_tkp,
    ROUND(AVG(total)) as avg_total,
    COUNT(*) as total_tryouts,
    MAX(date) as last_active
FROM 
    public.fair_package_leaderboard
GROUP BY 
    user_id, full_name;

-- Grant access to authenticated users
GRANT SELECT ON public.fair_package_leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard_averages TO authenticated;

-- Reload PostgREST to reflect changes
NOTIFY pgrst, 'reload schema';
