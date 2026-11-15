-- 1. Hapus fitur referral yang tidak dipakai.
-- 2. Tambah tabel analytics_events untuk mengukur funnel penjualan
--    tanpa layanan pihak ketiga (tanpa cookie banner).

begin;

-- ── 1. Referral dihapus ────────────────────────────────────────────────────
alter table public.profiles drop column if exists referral_code;
alter table public.profiles drop column if exists referral_points;

-- ── 2. Analytics ───────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id bigserial primary key,
  name text not null,
  session_id text,
  user_id uuid references auth.users(id) on delete set null,
  path text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Hanya event yang dikenal yang boleh masuk, agar tabel tidak jadi tempat sampah.
alter table public.analytics_events
  drop constraint if exists analytics_events_name_check;

alter table public.analytics_events
  add constraint analytics_events_name_check
  check (name in (
    'view_landing',
    'view_pricing',
    'view_paket',
    'click_wa',
    'request_created',
    'free_claimed'
  ));

create index if not exists idx_analytics_events_created
  on public.analytics_events (created_at desc);

create index if not exists idx_analytics_events_name_created
  on public.analytics_events (name, created_at desc);

create index if not exists idx_analytics_events_session
  on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

-- Siapa pun (termasuk pengunjung anonim) boleh mencatat event.
drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

-- Hanya admin yang boleh membaca.
drop policy if exists analytics_events_admin_read on public.analytics_events;
create policy analytics_events_admin_read
  on public.analytics_events
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists analytics_events_admin_delete on public.analytics_events;
create policy analytics_events_admin_delete
  on public.analytics_events
  for delete
  to authenticated
  using (public.is_admin());

notify pgrst, 'reload schema';

commit;
