-- Integritas sesi ujian:
--  1. Progres tidak boleh disimpan setelah waktu ujian habis, supaya siswa
--     tidak bisa menambah jawaban lewat klien yang dimodifikasi.
--  2. Sesi yang sudah lama kedaluwarsa dibersihkan otomatis agar tabel tidak
--     menumpuk (dan siswa bisa memulai tryout ulang setelah masa berlaku lewat).

begin;

create or replace function public.save_tryout_progress(
  p_tryout_id uuid,
  p_answers jsonb,
  p_current_idx integer default 0,
  p_flagged integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_end timestamptz;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select s.end_time into v_end
  from public.active_tryout_sessions s
  where s.user_id = v_user
    and s.tryout_id = p_tryout_id
  limit 1;

  if v_end is null then
    raise exception 'Sesi ujian tidak ditemukan';
  end if;

  -- Waktu habis: jawaban baru tidak diterima lagi.
  if v_end <= now() then
    raise exception 'Waktu ujian sudah habis, jawaban tidak dapat disimpan'
      using errcode = 'check_violation';
  end if;

  update public.active_tryout_sessions
  set answers = coalesce(p_answers, '{}'::jsonb),
      current_idx = greatest(coalesce(p_current_idx, 0), 0),
      flagged = greatest(coalesce(flagged, 0), coalesce(p_flagged, 0)),
      updated_at = now()
  where user_id = v_user
    and tryout_id = p_tryout_id;
end;
$$;

revoke all on function public.save_tryout_progress(uuid, jsonb, integer, integer) from public, anon;
grant execute on function public.save_tryout_progress(uuid, jsonb, integer, integer) to authenticated, service_role;

-- Mulai sesi: bersihkan sesi lama yang sudah lewat lebih dari 1 jam, sehingga
-- siswa bisa mengulang tryout tanpa terhalang sesi yang menggantung.
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
    or exists (
      select 1
      from public.events e
      where e.package_id = p_tryout_id
        and e.is_active
        and (e.start_date is null or e.start_date <= now())
        and (e.end_date is null or e.end_date >= now())
    )
  ) into v_has_access;

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
      coalesce(v_session.flagged, 0),
      coalesce(v_session.current_idx, 0),
      (v_session.end_time <= now());
    return;
  end if;

  insert into public.active_tryout_sessions (
    user_id, tryout_id, end_time, answers, flagged, current_idx
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
