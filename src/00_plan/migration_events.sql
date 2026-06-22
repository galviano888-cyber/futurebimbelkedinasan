-- ============================================================
-- MIGRATION: Events & Event Results
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel events
CREATE TABLE IF NOT EXISTS public.events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  package_id    UUID REFERENCES public.tryout_packages(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel event_results (1 hasil per user per event)
CREATE TABLE IF NOT EXISTS public.event_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total         INTEGER NOT NULL DEFAULT 0,
  twk           INTEGER NOT NULL DEFAULT 0,
  tiu           INTEGER NOT NULL DEFAULT 0,
  tkp           INTEGER NOT NULL DEFAULT 0,
  answers       JSONB NOT NULL DEFAULT '{}',
  score_details JSONB,
  finished_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Satu user hanya bisa submit sekali per event
  UNIQUE(event_id, user_id)
);

-- 3. Index untuk performa leaderboard
CREATE INDEX IF NOT EXISTS idx_event_results_event_id ON public.event_results(event_id);
CREATE INDEX IF NOT EXISTS idx_event_results_user_id  ON public.event_results(user_id);
CREATE INDEX IF NOT EXISTS idx_event_results_total    ON public.event_results(event_id, total DESC);

-- 4. RLS (Row Level Security)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_results ENABLE ROW LEVEL SECURITY;

-- Events: siapa saja bisa baca, hanya service_role yang bisa tulis
CREATE POLICY "events_select_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_insert_admin" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE USING (auth.role() = 'service_role');

-- Event Results: user bisa baca semua (untuk leaderboard), user hanya bisa insert milik sendiri
CREATE POLICY "event_results_select_all" ON public.event_results
  FOR SELECT USING (true);

CREATE POLICY "event_results_insert_own" ON public.event_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin bisa hapus result (untuk reset)
CREATE POLICY "event_results_delete_admin" ON public.event_results
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================
-- CATATAN:
-- Kalau admin panel gagal insert/update events karena RLS,
-- ubah policy events_insert_admin & events_update_admin menjadi:
--   WITH CHECK (true)
-- atau gunakan Supabase service_role key di backend.
--
-- Alternatif cepat untuk dev (izinkan semua authenticated user):
-- DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
-- CREATE POLICY "events_insert_auth" ON public.events
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "events_update_admin" ON public.events;
-- CREATE POLICY "events_update_auth" ON public.events
--   FOR UPDATE USING (auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "events_delete_admin" ON public.events;
-- CREATE POLICY "events_delete_auth" ON public.events
--   FOR DELETE USING (auth.role() = 'authenticated');
-- ============================================================
