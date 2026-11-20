-- Jumlah peserta yang sedang mengerjakan satu tryout.
-- Dipakai klien untuk menyesuaikan jeda autosave saat event ramai,
-- tanpa membuka akses baca ke tabel sesi peserta lain.
begin;

create or replace function public.count_active_tryout_participants(p_tryout_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(count(*), 0)::integer
  from public.active_tryout_sessions s
  where s.tryout_id = p_tryout_id
    and s.end_time > now();
$$;

revoke all on function public.count_active_tryout_participants(uuid) from public, anon;
grant execute on function public.count_active_tryout_participants(uuid)
  to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
