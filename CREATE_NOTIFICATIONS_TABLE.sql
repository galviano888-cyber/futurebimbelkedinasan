-- ==========================================================
-- SETUP TABEL NOTIFICATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- DROP POLICIES IF EXISTS (To avoid errors on rerun)
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admin insert notifications" ON public.notifications;

-- CREATE POLICIES
-- 1. Users can view their own notifications
CREATE POLICY "Users view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Admin can manage all notifications (insert, delete)
CREATE POLICY "Admin manage notifications" 
ON public.notifications FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
