-- Supabase Setup Script for Future Bimbel Kedinasan
-- Silakan copy-paste script ini ke menu SQL Editor di Supabase Dashboard Anda.

-- 1. Create the tryout_results table
CREATE TABLE IF NOT EXISTS public.tryout_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    package_name TEXT NOT NULL,
    twk INTEGER NOT NULL,
    tiu INTEGER NOT NULL,
    tkp INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Set up Row Level Security (RLS)
-- Ini penting agar user hanya bisa melihat nilai tryout mereka sendiri.
ALTER TABLE public.tryout_results ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Users can view their own tryout results" 
    ON public.tryout_results FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tryout results" 
    ON public.tryout_results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Selesai! Jalankan script ini dan database Anda siap digunakan.
