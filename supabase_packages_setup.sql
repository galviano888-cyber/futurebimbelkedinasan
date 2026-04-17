-- ====================================================================================
-- SCRIPT SETUP DATABASE: PAKET, TRANSAKSI, DAN HAK AKSES
-- ====================================================================================

-- 1. Buat Tabel Master Paket
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Buat Tabel Isi Paket (Materi, Video, Tryout)
CREATE TABLE IF NOT EXISTS public.package_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('file', 'video', 'tryout')),
    title TEXT NOT NULL,
    url TEXT, -- Link file/video (opsional)
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Buat Tabel Transaksi (Terhubung dengan Midtrans)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY, -- Pakai TEXT karena ID dari Midtrans berupa string (Order ID)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
    snap_token TEXT, -- Token pop-up pembayaran midtrans
    snap_redirect_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Buat Tabel Kepemilikan Paket (Hak Akses Siswa)
CREATE TABLE IF NOT EXISTS public.user_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    transaction_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, package_id) -- Mencegah 1 siswa beli paket yang sama 2x
);

-- ====================================================================================
-- ROW LEVEL SECURITY (RLS) - ATURAN KEAMANAN SUPABASE
-- ====================================================================================

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa lihat paket yang dijual
CREATE POLICY "Public can view active packages" 
ON public.packages FOR SELECT 
USING (is_active = true);

-- Semua orang bisa lihat daftar isi materi paket (untuk promosi)
CREATE POLICY "Public can view package contents" 
ON public.package_contents FOR SELECT 
USING (true);

-- Siswa HANYA bisa melihat transaksinya sendiri
CREATE POLICY "Users view own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Siswa HANYA bisa membuat transaksinya sendiri
CREATE POLICY "Users insert own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Siswa HANYA bisa melihat hak akses paketnya sendiri
CREATE POLICY "Users view own access" 
ON public.user_packages FOR SELECT 
USING (auth.uid() = user_id);

-- (Penting) user_packages tidak boleh di-insert langsung oleh user,
-- hanya boleh di-insert melalui API Backend (Vercel) setelah pembayaran divalidasi.

-- ====================================================================================
-- MASUKKAN 1 PAKET DUMMY UNTUK TESTING
-- ====================================================================================

-- Kita masukkan paket "Program Intensif SKD Batch 1" dengan harga Rp 99.000
INSERT INTO public.packages (id, title, description, price, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Program Intensif SKD Batch 1', 
    'Persiapan maksimal untuk lulus tes SKD Kedinasan 2026',
    99000, 
    true
) ON CONFLICT DO NOTHING;

-- Masukkan isi paketnya
INSERT INTO public.package_contents (package_id, type, title, order_index)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'file', 'Materi TWK Lengkap (PDF)', 1),
    ('11111111-1111-1111-1111-111111111111', 'file', 'Rumus Cepat TIU (PDF)', 2),
    ('11111111-1111-1111-1111-111111111111', 'video', 'Rekaman Zoom: Bedah Soal HOTS', 3),
    ('11111111-1111-1111-1111-111111111111', 'tryout', 'Tryout Premium SKD 1', 4);
