-- Fix typo di policy user_packages: t.package_id = t.package_id harusnya t.package_id = user_packages.package_id

DROP POLICY IF EXISTS "Users insert free packages" ON public.user_packages;
DROP POLICY IF EXISTS "Users insert paid packages with success transaction" ON public.user_packages;

-- Gabungkan jadi satu policy yang benar
CREATE POLICY "Users insert own packages"
ON public.user_packages
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
        -- Paket gratis
        EXISTS (
            SELECT 1 FROM public.packages p 
            WHERE p.id = package_id AND p.price = 0
        )
        OR
        -- Paket berbayar dengan transaksi success milik user untuk paket ini
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.user_id = auth.uid()
            AND t.package_id = package_id  -- package_id merujuk ke user_packages.package_id
            AND t.status = 'success'
        )
    )
);

NOTIFY pgrst, 'reload schema';
