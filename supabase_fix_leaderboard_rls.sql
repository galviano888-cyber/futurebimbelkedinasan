-- ====================================================================================
-- FIX: RLS Policies for National Leaderboard
-- ====================================================================================

-- 1. tryout_results: Allow all authenticated users to see scores for the leaderboard
DROP POLICY IF EXISTS "Users can view own tryout results" ON public.tryout_results;
DROP POLICY IF EXISTS "Authenticated users can view all tryout results" ON public.tryout_results;
DROP POLICY IF EXISTS "Users can view their own tryout results" ON public.tryout_results;

CREATE POLICY "Public leaderboard visibility" 
ON public.tryout_results FOR SELECT 
TO authenticated
USING (true);

-- 2. profiles: Allow all authenticated users to see student names for the leaderboard
-- This ensures join queries in LeaderboardView work for all accounts.
DROP POLICY IF EXISTS "Public profile visibility" ON public.profiles;
CREATE POLICY "Public profile visibility" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

-- 3. Ensure users can still manage their own profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
