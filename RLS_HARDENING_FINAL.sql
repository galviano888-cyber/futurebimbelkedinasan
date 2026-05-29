-- ==========================================================
-- FINAL RLS HARDENING: FUTURE BIMBEL KEDINASAN
-- ==========================================================

-- 1. RE-DEFINE IS_ADMIN (Lebih Fleksibel & Aman)
-- Sekarang mendukung app_metadata role DAN hardcoded email sebagai fallback
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
        OR (auth.jwt() ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RESET RLS STATE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. CLEANUP SEMUA POLICY LAMA
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 4. IMPLEMENTASI POLICY BARU (Pematapan)

-- [PROFILES]
CREATE POLICY "Admin manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Public view public profiles" ON public.profiles FOR SELECT USING (is_public = true);

-- [TRYOUT_RESULTS]
CREATE POLICY "Admin manage all results" ON public.tryout_results FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own results" ON public.tryout_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own results" ON public.tryout_results FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Note: Kita biarkan hasil tetap terbaca via views (leaderboard) yang sudah memfilter data sensitif.

-- [TRYOUT_PACKAGES & QUESTIONS]
CREATE POLICY "Admin manage all tryouts" ON public.tryout_packages FOR ALL USING (public.is_admin());
CREATE POLICY "Auth view tryout packages" ON public.tryout_packages FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage all questions" ON public.tryout_questions FOR ALL USING (public.is_admin());
CREATE POLICY "Users view questions if they have access" 
ON public.tryout_questions 
FOR SELECT 
USING (
    public.is_admin() 
    OR EXISTS (
        SELECT 1 FROM public.user_packages up 
        JOIN public.package_contents pc ON up.package_id = pc.package_id 
        WHERE up.user_id = auth.uid() AND pc.tryout_id = public.tryout_questions.package_id
    )
);

-- [TRANSACTIONS]
CREATE POLICY "Admin manage all transactions" ON public.transactions FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pending transactions" ON public.transactions 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (status = 'verifying' OR status = 'pending' OR status = 'failed'));

-- [USER_PACKAGES]
CREATE POLICY "Admin manage all user packages" ON public.user_packages FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own packages" ON public.user_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert free packages" ON public.user_packages 
FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.packages p 
        WHERE p.id = package_id AND p.price = 0
    )
);

-- [PACKAGES & CONTENTS (KATALOG)]
CREATE POLICY "Public view packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admin manage packages" ON public.packages FOR ALL USING (public.is_admin());

CREATE POLICY "Public view contents" ON public.package_contents FOR SELECT USING (true);
CREATE POLICY "Admin manage contents" ON public.package_contents FOR ALL USING (public.is_admin());

-- [SITE_SETTINGS]
CREATE POLICY "Public view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- 5. RE-INITIALIZE VIEWS (Agar sinkron dengan RLS)
-- Penting: Views di Supabase menghormati RLS tabel dasarnya.
NOTIFY pgrst, 'reload schema';

-- 6. RPC: DELETE USER BY ADMIN (Security Definer agar bisa hapus di auth.users)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF public.is_admin() THEN
        DELETE FROM auth.users WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Hanya admin yang bisa menghapus user.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
