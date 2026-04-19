-- ====================================================================================
-- FIX: Sync tryout_results table with fair ranking and engine requirements
-- ====================================================================================

-- 1. Ensure all required columns exist in tryout_results
ALTER TABLE public.tryout_results 
ADD COLUMN IF NOT EXISTS package_id UUID,
ADD COLUMN IF NOT EXISTS tryout_id UUID,
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS score_details JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure total is calculated correctly (optional, but good for data integrity)
-- If 'total' is already there, we just leave it.

-- 3. Update RLS to ensure visibility for leaderboard
-- Already handled in supabase_fix_leaderboard_rls.sql, but let's be safe.
DROP POLICY IF EXISTS "Public leaderboard visibility" ON public.tryout_results;
CREATE POLICY "Public leaderboard visibility" 
ON public.tryout_results FOR SELECT 
TO authenticated
USING (true);

-- 4. Re-create or Update the Fair Ranking View
-- (This matches what's in supabase_fair_ranking.sql but ensures it runs AFTER columns are added)

DROP VIEW IF EXISTS public.leaderboard_averages CASCADE;
DROP VIEW IF EXISTS public.fair_package_leaderboard CASCADE;

CREATE OR REPLACE VIEW public.fair_package_leaderboard AS
SELECT DISTINCT ON (tr.user_id, tr.package_id, tr.tryout_id)
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
    tr.user_id, tr.package_id, tr.tryout_id, tr.date ASC;

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

GRANT SELECT ON public.fair_package_leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard_averages TO authenticated;

NOTIFY pgrst, 'reload schema';
