-- ====================================================================================
-- FASE 1: REFINEMENT DATABASE (MANUAL INVOICE SYSTEM)
-- ====================================================================================

-- 1. Tambahkan tipe produk ke tabel packages
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'SATUAN' 
CHECK (product_type IN ('SATUAN', 'BUNDLE', 'INTENSIF'));

-- 2. Perluas tabel package_contents
ALTER TABLE public.package_contents 
ADD COLUMN IF NOT EXISTS tryout_id UUID REFERENCES public.tryout_packages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- 3. Update Tabel Transaksi untuk Sistem Invoice Manual
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Pastikan kolom yang dibutuhkan ada
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS invoice_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status agar sesuai permintaan
ALTER TABLE public.transactions 
ALTER COLUMN status SET DEFAULT 'PENDING',
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('PENDING', 'VERIFYING', 'SUCCESS', 'FAILED', 'EXPIRED'));

-- 4. Setup Storage Bucket untuk Bukti Pembayaran
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan Storage: Siswa bisa upload, Admin bisa lihat semua
DROP POLICY IF EXISTS "Siswa can upload proof" ON storage.objects;
CREATE POLICY "Siswa can upload proof" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view proof" ON storage.objects;
CREATE POLICY "Public can view proof" ON storage.objects
    FOR SELECT USING (bucket_id = 'payment-proofs');

-- 5. Tabel Jadwal (Tetap diperlukan untuk Paket Intensif)
CREATE TABLE IF NOT EXISTS public.package_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    zoom_link TEXT,
    is_live BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.package_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active schedules" ON public.package_schedules;
CREATE POLICY "Public can view active schedules" ON public.package_schedules FOR SELECT USING (true);
