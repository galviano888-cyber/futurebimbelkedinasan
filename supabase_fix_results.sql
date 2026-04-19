-- ====================================================================================
-- FIX: Sync tryout_results table with UI requirements
-- ====================================================================================

-- 1. Ensure all required columns exist in tryout_results
ALTER TABLE public.tryout_results 
ADD COLUMN IF NOT EXISTS package_id UUID,
ADD COLUMN IF NOT EXISTS score_details JSONB;

-- 2. Handle 'total' column if it's not already generated
-- If it exists as a regular column, we might want to keep it or convert it.
-- Based on the error reports, it's likely a mismatch.
-- If you want to make it generated:
-- ALTER TABLE public.tryout_results DROP COLUMN IF EXISTS total;
-- ALTER TABLE public.tryout_results ADD COLUMN total integer GENERATED ALWAYS AS (twk + tiu + tkp) STORED;

-- 3. Ensure RLS allows the insert
DROP POLICY IF EXISTS "Users can insert own tryout results" ON public.tryout_results;
CREATE POLICY "Users can insert own tryout results" 
ON public.tryout_results FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure Select policy is correct
DROP POLICY IF EXISTS "Users can view own tryout results" ON public.tryout_results;
CREATE POLICY "Users can view own tryout results"
ON public.tryout_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
