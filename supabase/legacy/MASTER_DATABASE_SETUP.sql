-- ==========================================================
-- MASTER DATABASE SETUP: FUTURE BIMBEL KEDINASAN (ULTIMATE CLEAN)
-- ==========================================================

-- 0. PEMBERSIHAN TOTAL (ANTI-CONFLICT)
DROP TRIGGER IF EXISTS trg_auto_score ON public.tryout_results;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.calculate_tryout_score() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.fbk_calculate_tryout_score() CASCADE;
DROP FUNCTION IF EXISTS public.fbk_handle_new_user() CASCADE;
DROP VIEW IF EXISTS public.leaderboard_averages CASCADE;
DROP VIEW IF EXISTS public.fair_package_leaderboard CASCADE;
DROP VIEW IF EXISTS public.tryout_questions_exam CASCADE;

-- 1. TABEL UTAMA
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    whatsapp TEXT,
    school TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAKSA TAMBAH KOLOM (Jika tabel sudah ada tapi kolom belum ada)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. TABEL SOAL & PAKET
CREATE TABLE IF NOT EXISTS public.tryout_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER DEFAULT 100,
    category TEXT DEFAULT 'SKD',
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tryout_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.tryout_packages(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    options JSONB NOT NULL,
    correct_answer TEXT,
    tkp_scores JSONB,
    explanation TEXT,
    fast_tips TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.tryout_questions_exam AS
SELECT id, package_id, number, category, question_text, question_image_url, options
FROM public.tryout_questions;

-- 3. KATALOG PRODUK
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER DEFAULT 0,
    original_price INTEGER DEFAULT 0,
    product_type TEXT DEFAULT 'SATUAN',
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    guide_url TEXT,
    guide_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    tryout_id UUID REFERENCES public.tryout_packages(id) ON DELETE SET NULL,
    zoom_link TEXT,
    recording_url TEXT,
    schedule_date TEXT,
    mentor_name TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRANSAKSI & AKSES
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    invoice_id TEXT UNIQUE,
    payment_proof_url TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, package_id)
);

-- 5. HASIL UJIAN
CREATE TABLE IF NOT EXISTS public.tryout_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    tryout_id UUID REFERENCES public.tryout_packages(id) ON DELETE SET NULL,
    package_name TEXT,
    twk INTEGER DEFAULT 0,
    tiu INTEGER DEFAULT 0,
    tkp INTEGER DEFAULT 0,
    twk_correct INTEGER DEFAULT 0,
    tiu_correct INTEGER DEFAULT 0,
    tkp_correct INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    answers JSONB,
    score_details JSONB,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. VIEWS LEADERBOARD
CREATE OR REPLACE VIEW public.fair_package_leaderboard AS
SELECT DISTINCT ON (user_id, package_id)
    id, user_id, package_id, tryout_id, package_name, twk, tiu, tkp, total, answers, score_details, date, created_at
FROM public.tryout_results
ORDER BY user_id, package_id, total DESC, created_at ASC;

CREATE OR REPLACE VIEW public.leaderboard_averages AS
SELECT 
    user_id, p.full_name, p.school,
    ROUND(AVG(total)) as total,
    ROUND(AVG(twk)) as twk,
    ROUND(AVG(tiu)) as tiu,
    ROUND(AVG(tkp)) as tkp,
    COUNT(l.id) as packages_completed
FROM public.fair_package_leaderboard l
JOIN public.profiles p ON l.user_id = p.id
GROUP BY user_id, p.full_name, p.school;

-- 7. CMS SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. FUNGSI ADMIN & SECURITY
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::jsonb ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com')
        OR auth.jwt() ->> 'email' IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AUTO SCORING (STABLE VERSION)
CREATE OR REPLACE FUNCTION public.fbk_calculate_tryout_score()
RETURNS TRIGGER AS $$
DECLARE
    v_data JSONB;
    v_answers JSONB;
    v_tryout_id UUID;
    v_twk INTEGER;
    v_tiu INTEGER;
    v_tkp INTEGER;
    v_twk_c INTEGER;
    v_tiu_c INTEGER;
    v_tkp_c INTEGER;
BEGIN
    v_data := to_jsonb(new);
    v_answers := v_data->'answers';
    v_tryout_id := (v_data->>'tryout_id')::UUID;

    -- Hitung skor satu per satu (Cara paling aman dari error relation)
    v_twk := COALESCE((SELECT SUM(CASE WHEN (v_answers->>q.id::text) = q.correct_answer THEN 5 ELSE 0 END) FROM public.tryout_questions q WHERE q.package_id = v_tryout_id AND q.category = 'TWK'), 0);
    v_tiu := COALESCE((SELECT SUM(CASE WHEN (v_answers->>q.id::text) = q.correct_answer THEN 5 ELSE 0 END) FROM public.tryout_questions q WHERE q.package_id = v_tryout_id AND q.category = 'TIU'), 0);
    v_tkp := COALESCE((SELECT SUM((q.tkp_scores->>(v_answers->>q.id::text))::integer) FROM public.tryout_questions q WHERE q.package_id = v_tryout_id AND q.category = 'TKP'), 0);
    
    v_twk_c := (SELECT COUNT(*) FROM public.tryout_questions q WHERE q.package_id = v_tryout_id AND q.category = 'TWK' AND (v_answers->>q.id::text) = q.correct_answer);
    v_tiu_c := (SELECT COUNT(*) FROM public.tryout_questions q WHERE q.package_id = v_tryout_id AND q.category = 'TIU' AND (v_answers->>q.id::text) = q.correct_answer);
    v_tkp_c := (SELECT COUNT(*) FROM public.tryout_questions q WHERE q.package_id = v_tryout_id AND q.category = 'TKP' AND (v_answers->>q.id::text) IS NOT NULL);

    -- Masukkan kembali ke record new
    new.twk := v_twk;
    new.tiu := v_tiu;
    new.tkp := v_tkp;
    new.twk_correct := v_twk_c;
    new.tiu_correct := v_tiu_c;
    new.tkp_correct := v_tkp_c;
    new.total := v_twk + v_tiu + v_tkp;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_score BEFORE INSERT ON public.tryout_results FOR EACH ROW EXECUTE FUNCTION public.fbk_calculate_tryout_score();

-- FUNGSI HANDLE NEW USER
CREATE OR REPLACE FUNCTION public.fbk_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_data JSONB;
    v_user_id UUID;
    v_email TEXT;
    v_meta JSONB;
BEGIN
    v_data := to_jsonb(new);
    v_user_id := (v_data->>'id')::UUID;
    v_email := v_data->>'email';
    v_meta := v_data->'raw_user_meta_data';

    -- Insert ke profile
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        v_user_id, 
        COALESCE(v_meta->>'full_name', v_email), 
        v_email
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.fbk_handle_new_user();

-- 9. KEAMANAN RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_results ENABLE ROW LEVEL SECURITY;

-- CLEANUP POLICIES (Prevent "Already Exists" Errors)
DROP POLICY IF EXISTS "Public view settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin manage settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public view packages" ON public.packages;
DROP POLICY IF EXISTS "Admin manage packages" ON public.packages;
DROP POLICY IF EXISTS "Public view contents" ON public.package_contents;
DROP POLICY IF EXISTS "Admin manage contents" ON public.package_contents;
DROP POLICY IF EXISTS "Auth view tryout packages" ON public.tryout_packages;
DROP POLICY IF EXISTS "Admin manage tryout packages" ON public.tryout_packages;
DROP POLICY IF EXISTS "Auth view questions" ON public.tryout_questions;
DROP POLICY IF EXISTS "Admin manage questions" ON public.tryout_questions;
DROP POLICY IF EXISTS "Auth view results" ON public.tryout_results;
DROP POLICY IF EXISTS "Admin manage results" ON public.tryout_results;
DROP POLICY IF EXISTS "Users view their own packages" ON public.user_packages;
DROP POLICY IF EXISTS "Admin manage user packages" ON public.user_packages;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view their own profile" ON public.profiles;

-- CREATE POLICIES
CREATE POLICY "Public view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public view packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admin manage packages" ON public.packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public view contents" ON public.package_contents FOR SELECT USING (true);
CREATE POLICY "Admin manage contents" ON public.package_contents FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Auth view tryout packages" ON public.tryout_packages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage tryout packages" ON public.tryout_packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Auth view questions" ON public.tryout_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage questions" ON public.tryout_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Auth view results" ON public.tryout_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage results" ON public.tryout_results FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users view their own packages" ON public.user_packages FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin manage user packages" ON public.user_packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 10. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_tryout_review(target_result_id UUID)
RETURNS TABLE (
    id UUID,
    category TEXT,
    number INTEGER,
    question_text TEXT,
    question_image_url TEXT,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    fast_tips TEXT,
    tkp_scores JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.category,
        q.number,
        q.question_text,
        q.question_image_url,
        q.options,
        q.correct_answer,
        q.explanation,
        q.fast_tips,
        q.tkp_scores
    FROM public.tryout_questions q
    JOIN public.tryout_results r ON q.package_id = r.tryout_id
    WHERE r.id = target_result_id
    ORDER BY q.number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RELOAD
NOTIFY pgrst, 'reload schema';
