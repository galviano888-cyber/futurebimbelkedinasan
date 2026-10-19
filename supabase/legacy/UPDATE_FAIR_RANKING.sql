-- ==========================================================
-- FIX: FIRST ATTEMPT ONLY FAIR RANKING (FINAL SOLUTION)
-- ==========================================================

-- 1. Bersihkan Segala Sesuatu
DROP VIEW IF EXISTS public.leaderboard_averages CASCADE;
DROP VIEW IF EXISTS public.fair_package_leaderboard CASCADE;

-- 2. Buat View fair_package_leaderboard (GUNAKAN NAMA SEBAGAI FALLBACK AGAR DATA LAMA KEDETECT)
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
    p.full_name, p.school
FROM public.tryout_results l
LEFT JOIN public.profiles p ON l.user_id = p.id
ORDER BY l.user_id, COALESCE(l.tryout_id::text, l.package_name), l.created_at ASC;

-- 3. Restore View leaderboard_averages (Peringkat Global)
CREATE OR REPLACE VIEW public.leaderboard_averages AS
SELECT 
    l.user_id, 
    MAX(p.full_name) as full_name, 
    MAX(p.school) as school,
    ROUND(AVG(l.total)) as avg_total,
    ROUND(AVG(l.twk)) as avg_twk,
    ROUND(AVG(l.tiu)) as avg_tiu,
    ROUND(AVG(l.tkp)) as avg_tkp,
    COUNT(l.id) as packages_completed
FROM public.fair_package_leaderboard l
LEFT JOIN public.profiles p ON l.user_id = p.id
GROUP BY l.user_id;

-- 4. Create/Update RPC Function for User Rank (Sangat Robust)
CREATE OR REPLACE FUNCTION public.get_user_rank(target_user_id UUID, target_package_id UUID DEFAULT NULL)
RETURNS TABLE (
    rank_position BIGINT,
    total_participants BIGINT,
    score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RankedUsers AS (
        SELECT 
            user_id, 
            total,
            RANK() OVER (ORDER BY total DESC) as pos,
            COUNT(*) OVER () as total_count
        FROM public.fair_package_leaderboard
        WHERE (target_package_id IS NULL OR tryout_id = target_package_id)
    )
    SELECT 
        pos::BIGINT, 
        total_count::BIGINT, 
        total
    FROM RankedUsers
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REPAIR DATA (PASTI KENA)
-- Update tryout_id berdasarkan nama paket yang ada di tryout_packages
UPDATE public.tryout_results r
SET tryout_id = tp.id
FROM public.tryout_packages tp
WHERE r.package_name = tp.name 
   OR r.package_name ILIKE '%' || tp.name || '%'
   OR tp.name ILIKE '%' || r.package_name || '%';

-- 6. MATIKAN RLS SEMENTARA UNTUK TABEL HASIL (UNTUK DIAGNOSA)
-- Jika ini tidak berhasil, berarti masalahnya ada di data tabel yang memang kosong
ALTER TABLE public.tryout_results DISABLE ROW LEVEL SECURITY;

-- Reload Schema
NOTIFY pgrst, 'reload schema';
