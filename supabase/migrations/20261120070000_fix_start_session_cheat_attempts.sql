-- Perbaiki start_tryout_session yang rusak.
--
-- Migrasi event sebelumnya menulis ulang fungsi ini dengan kolom `flagged`
-- (sudah tidak ada) alih-alih `cheat_attempts`, sehingga peserta mendapat
-- error PostgreSQL 42804 saat memulai ujian:
--   column "flagged" is of type jsonb but expression is of type integer
--
-- Versi ini mempertahankan aturan event (peserta wajib terdaftar) dan
-- memakai kolom cheat_attempts yang benar.

begin;

create or replace function public.start_tryout_session(p_tryout_id uuid)
returns table (
  session_id uuid,
  end_time timestamptz,
  answers jsonb,
  flagged integer,
  current_idx integer,
  expired boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_duration integer;
  v_session public.active_tryout_sessions%rowtype;
  v_has_access boolean;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select tp.duration_minutes into v_duration
  from public.tryout_packages tp
  where tp.id = p_tryout_id;

  if v_duration is null then
    raise exception 'Paket tryout tidak ditemukan';
  end if;

  select (
    public.is_admin()
    or exists (
      select 1
      from public.user_packages up
      join public.package_contents pc on pc.package_id = up.package_id
      where up.user_id = v_user
        and pc.tryout_id = p_tryout_id
    )
  ) into v_has_access;

  if not v_has_access then
    if exists (
      select 1
      from public.event_registrations er
      join public.events e on e.id = er.event_id
      where er.user_id = v_user
        and e.package_id = p_tryout_id
        and e.is_active
        and (e.start_date is null or e.start_date <= now())
        and (e.end_date is null or e.end_date >= now())
    ) then
      v_has_access := true;
    elsif exists (
      select 1
      from public.events e
      where e.package_id = p_tryout_id
        and e.is_active
        and (e.start_date is null or e.start_date <= now())
        and (e.end_date is null or e.end_date >= now())
    ) then
      raise exception 'Kamu belum terdaftar pada Tryout Akbar ini';
    end if;
  end if;

  if not v_has_access then
    raise exception 'Anda tidak memiliki akses ke tryout ini';
  end if;

  -- Sesi kedaluwarsa lebih dari 1 jam dianggap selesai; hapus agar bisa mulai baru.
  delete from public.active_tryout_sessions s
  where s.user_id = v_user
    and s.tryout_id = p_tryout_id
    and s.end_time < now() - interval '1 hour';

  select s.* into v_session
  from public.active_tryout_sessions s
  where s.user_id = v_user
    and s.tryout_id = p_tryout_id
  limit 1;

  if found then
    return query select
      v_session.id,
      v_session.end_time,
      coalesce(v_session.answers, '{}'::jsonb),
      coalesce(v_session.cheat_attempts, 0),
      coalesce(v_session.current_idx, 0),
      (v_session.end_time <= now());
    return;
  end if;

  insert into public.active_tryout_sessions (
    user_id, tryout_id, end_time, answers, cheat_attempts, current_idx
  )
  values (
    v_user,
    p_tryout_id,
    now() + make_interval(mins => greatest(coalesce(v_duration, 100), 1)),
    '{}'::jsonb,
    0,
    0
  )
  returning * into v_session;

  return query select v_session.id, v_session.end_time, '{}'::jsonb, 0, 0, false;
end;
$$;

revoke all on function public.start_tryout_session(uuid) from public, anon;
grant execute on function public.start_tryout_session(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
