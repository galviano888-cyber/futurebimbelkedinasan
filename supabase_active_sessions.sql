-- Tabel untuk melacak sesi tryout yang sedang berlangsung
CREATE TABLE IF NOT EXISTS public.active_tryout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL, -- ID Bundle/Parent
    tryout_id UUID NOT NULL, -- ID Spesifik Soal
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb,
    flagged JSONB DEFAULT '{}'::jsonb,
    current_idx INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk mempercepat pencarian sesi user
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON public.active_tryout_sessions(user_id);

-- Aktifkan RLS
ALTER TABLE public.active_tryout_sessions ENABLE ROW LEVEL SECURITY;

-- Policy agar user hanya bisa akses sesinya sendiri
CREATE POLICY "Users can manage their own active sessions" 
ON public.active_tryout_sessions 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function untuk update updated_at otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_active_sessions_updated_at
    BEFORE UPDATE ON public.active_tryout_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
