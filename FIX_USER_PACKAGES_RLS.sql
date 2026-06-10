-- Fix: Izinkan user insert ke user_packages jika punya transaksi success
-- Sebelumnya hanya paket gratis yang bisa diinsert dari client
-- Sekarang tambah policy untuk paket berbayar yang sudah dibayar via QRIS

CREATE POLICY "Users insert paid packages with success transaction"
ON public.user_packages
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.user_id = auth.uid()
        AND t.package_id = user_packages.package_id
        AND t.status = 'success'
    )
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
