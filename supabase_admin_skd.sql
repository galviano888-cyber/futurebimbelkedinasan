-- ==========================================
-- SCRIPT SETUP DATABASE ADMIN FBK (FASE 1)
-- ==========================================

-- 1. Tabel Paket Tryout
CREATE TABLE IF NOT EXISTS public.tryout_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'SKD',
    duration_minutes INTEGER DEFAULT 100,
    passing_grade_twk INTEGER DEFAULT 65,
    passing_grade_tiu INTEGER DEFAULT 80,
    passing_grade_tkp INTEGER DEFAULT 166,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft' atau 'Published'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabel Bank Soal Tryout
CREATE TABLE IF NOT EXISTS public.tryout_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.tryout_packages(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    category VARCHAR(10) NOT NULL, -- 'TWK', 'TIU', 'TKP'
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    
    -- Opsi Jawaban disimpan dalam format JSONB agar dinamis
    options JSONB NOT NULL, -- Contoh: {"A": "Teks A", "B": "Teks B"}
    options_image_url JSONB, -- Contoh: {"A": "url", "B": "url"}
    
    -- Kunci dan Bobot
    correct_answer VARCHAR(1), -- 'A', 'B', 'C', 'D', 'E' (Bisa NULL untuk TKP)
    tkp_scores JSONB, -- Khusus TKP. Contoh: {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}
    
    -- Pembahasan rahasia
    explanation TEXT,
    fast_tips TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Fungsi Cek Admin (Hardcoded untuk MVP)
CREATE OR REPLACE FUNCTION public.is_fbk_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') IN ('admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Keamanan Row Level Security (RLS)
ALTER TABLE public.tryout_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_questions ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS untuk Admin (Akses Penuh)
CREATE POLICY "Admin Full Access Packages" ON public.tryout_packages
    FOR ALL USING (public.is_fbk_admin());

CREATE POLICY "Admin Full Access Questions" ON public.tryout_questions
    FOR ALL USING (public.is_fbk_admin());

-- 6. Kebijakan RLS untuk Siswa (Hanya bisa baca yang sudah di-Publish)
CREATE POLICY "Siswa View Published Packages" ON public.tryout_packages
    FOR SELECT USING (status = 'Published' AND auth.role() = 'authenticated');

CREATE POLICY "Siswa View Questions of Published Packages" ON public.tryout_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tryout_packages 
            WHERE id = tryout_questions.package_id 
            AND status = 'Published'
        )
        AND auth.role() = 'authenticated'
    );

-- 7. Setup Storage Bucket untuk Upload Gambar Soal
INSERT INTO storage.buckets (id, name, public) 
VALUES ('question-media', 'question-media', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan Storage Admin (Upload, Delete, Update)
CREATE POLICY "Admin Manage Question Media" ON storage.objects
    FOR ALL USING (bucket_id = 'question-media' AND public.is_fbk_admin());

-- Kebijakan Storage Siswa (Hanya Boleh Lihat Gambar)
CREATE POLICY "Public View Question Media" ON storage.objects
    FOR SELECT USING (bucket_id = 'question-media');
