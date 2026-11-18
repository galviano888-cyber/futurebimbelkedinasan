-- Tryout Akbar: pendaftaran awal (pre-register), kuota peserta, pengingat
-- otomatis H-6 jam, penutupan event otomatis, dan leaderboard event.

begin;

-- 1. Kolom baru pada events -------------------------------------------------

alter table public.events
  add column if not exists quota integer,
  add column if not exists registration_closes_at timestamptz;

update public.events set quota = 50 where quota is null;
alter table public.events alter column quota set default 50;
alter table public.events alter column quota set not null;

alter table public.events drop constraint if exists events_quota_check;
alter table public.events
  add constraint events_quota_check check (quota between 1 and 100);

-- 2. Tabel pendaftaran ------------------------------------------------------

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seat_no integer not null default 0,
  registered_at timestamptz not null default now(),
  notified_6h_at timestamptz,
  notified_start_at timestamptz,
  unique (event_id, user_id)
);

create index if not exists event_registrations_event_idx
  on public.event_registrations (event_id);
create index if not exists event_registrations_user_idx
  on public.event_registrations (user_id);

alter table public.event_registrations enable row level security;

drop policy if exists "event_registrations_select_own" on public.event_registrations;
create policy "event_registrations_select_own"
  on public.event_registrations for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.event_registrations from anon, authenticated;
grant select on public.event_registrations to authenticated;

-- 3.Statistik kuota ---------------------------------------------------------

create or replace function public.get_event_registration_counts()
returns table (
  event_id uuid,
  registered_count integer,
  quota integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    coalesce(count(r.id), 0)::integer,
    e.quota
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  group by e.id, e.quota;
$$;

revoke all on function public.get_event_registration_counts() from public;
grant execute on function public.get_event_registration_counts()
  to authenticated, service_role;

-- 4. Pendaftaran event (kuota dikunci per baris event) ----------------------

create or replace function public.register_event(p_event_id uuid)
returns table (
  registered boolean,
  seat_no integer,
  registered_count integer,
  quota integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_event public.events%rowtype;
  v_count integer;
  v_seat integer;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  -- Kunci baris event: mencegah dua siswa merebut kursi terakhir bersamaan.
  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event tidak ditemukan';
  end if;

  if v_event.quota is null or v_event.quota < 1 or v_event.quota > 100 then
    raise exception 'Kuota event harus antara 1 sampai 100';
  end if;

  select r.seat_no into v_seat
  from public.event_registrations r
  where r.event_id = p_event_id and r.user_id = v_user;

  select count(*)::integer into v_count
  from public.event_registrations r
  where r.event_id = p_event_id;

  if v_seat is not null then
    return query select true, v_seat, v_count, v_event.quota;
    return;
  end if;

  if not v_event.is_active then
    raise exception 'Pendaftaran event belum dibuka';
  end if;

  if v_event.end_date is not null and v_event.end_date <= now() then
    raise exception 'Event sudah berakhir';
  end if;

  if v_event.start_date is not null
     and coalesce(v_event.registration_closes_at, v_event.start_date) <= now() then
    raise exception 'Pendaftaran sudah ditutup';
  end if;

  if v_event.quota is not null and v_count >= v_event.quota then
    raise exception 'Kuota pendaftaran sudah penuh';
  end if;

  v_seat := v_count + 1;

  insert into public.event_registrations (event_id, user_id, seat_no)
  values (p_event_id, v_user, v_seat);

  return query select true, v_seat, v_count + 1, v_event.quota;
end;
$$;

revoke all on function public.register_event(uuid) from public, anon;
grant execute on function public.register_event(uuid)
  to authenticated, service_role;

create or replace function public.cancel_event_registration(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_start timestamptz;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select e.start_date into v_start
  from public.events e
  where e.id = p_event_id;

  if v_start is not null and v_start <= now() then
    raise exception 'Event sudah dimulai, pendaftaran tidak dapat dibatalkan';
  end if;

  delete from public.event_registrations
  where event_id = p_event_id and user_id = v_user;

  with resequenced as (
    select id, row_number() over (order by registered_at, id)::integer as new_seat_no
    from public.event_registrations
    where event_id = p_event_id
  )
  update public.event_registrations r
  set seat_no = s.new_seat_no
  from resequenced s
  where r.id = s.id;
end;
$$;

revoke all on function public.cancel_event_registration(uuid) from public, anon;
grant execute on function public.cancel_event_registration(uuid)
  to authenticated, service_role;

-- 5. Leaderboard event ------------------------------------------------------
-- Sebelumnya baris difilter is_public = true sehingga leaderboard sering
-- kosong ("error" di UI). Sekarang semua peserta tampil; nama disamarkan
-- hanya jika siswa secara eksplisit menyembunyikan profilnya.

create or replace function public.get_event_leaderboard(p_event_id uuid)
returns table (
  user_id uuid,
  full_name text,
  total integer,
  twk integer,
  tiu integer,
  tkp integer,
  finished_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    er.user_id,
    case
      when coalesce(p.is_public, true) then coalesce(nullif(p.full_name, ''), 'Siswa FBK')
      else 'Peserta ' || upper(right(er.user_id::text, 4))
    end as full_name,
    er.total,
    er.twk,
    er.tiu,
    er.tkp,
    er.finished_at
  from public.event_results er
  left join public.profiles p on p.id = er.user_id
  where er.event_id = p_event_id
  order by er.total desc, er.finished_at asc
  limit 100;
$$;

revoke all on function public.get_event_leaderboard(uuid) from public;
grant execute on function public.get_event_leaderboard(uuid)
  to authenticated, service_role;

-- 6. Kirim hasil event: peserta wajib terdaftar -----------------------------

create or replace function public.submit_event_result(
  p_event_id uuid,
  p_result_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_event public.events%rowtype;
  v_result public.tryout_results%rowtype;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  select e.* into v_event from public.events e where e.id = p_event_id;
  if not found then
    raise exception 'Event tidak ditemukan';
  end if;

  if not public.is_admin()
     and not exists (
       select 1 from public.event_registrations r
       where r.event_id = p_event_id and r.user_id = v_user
     ) then
    raise exception 'Kamu belum terdaftar pada event ini';
  end if;

  select r.* into v_result
  from public.tryout_results r
  where r.id = p_result_id and r.user_id = v_user;

  if not found then
    raise exception 'Hasil tryout tidak ditemukan';
  end if;

  if v_result.tryout_id is distinct from v_event.package_id then
    raise exception 'Hasil tryout tidak cocok dengan event';
  end if;

  insert into public.event_results (
    event_id, user_id, total, twk, tiu, tkp, answers, score_details, finished_at
  )
  values (
    p_event_id, v_user, v_result.total, v_result.twk, v_result.tiu, v_result.tkp,
    v_result.answers, v_result.score_details, now()
  )
  on conflict (event_id, user_id) do nothing;
end;
$$;

revoke all on function public.submit_event_result(uuid, uuid) from public;
grant execute on function public.submit_event_result(uuid, uuid)
  to authenticated, service_role;

-- 7. Akses ujian lewat event wajib terdaftar --------------------------------

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
grant execute on function public.start_tryout_session(uuid)
  to authenticated, service_role;

-- Soal ujian juga hanya boleh dibaca peserta yang sudah mendaftar.
create or replace function public.get_exam_questions(p_tryout_id uuid)
returns table (
  id uuid,
  number integer,
  category text,
  sub_category text,
  question_text text,
  question_image_url text,
  options jsonb,
  options_image_url jsonb,
  option_images jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.number,
    q.category::text,
    q.sub_category::text,
    q.question_text,
    q.question_image_url,
    q.options,
    q.options_image_url,
    q.option_images
  from public.tryout_questions q
  where q.package_id = p_tryout_id
    and (
      public.is_admin()
      or coalesce(auth.role(), '') = 'service_role'
      or exists (
        select 1
        from public.user_packages up
        join public.package_contents pc on pc.package_id = up.package_id
        where up.user_id = auth.uid()
          and pc.tryout_id = p_tryout_id
      )
      or exists (
        select 1
        from public.event_registrations er
        join public.events e on e.id = er.event_id
        where er.user_id = auth.uid()
          and e.package_id = p_tryout_id
          and e.is_active
          and (e.start_date is null or e.start_date <= now())
          and (e.end_date is null or e.end_date >= now())
      )
    )
  order by q.number;
$$;

revoke all on function public.get_exam_questions(uuid) from public, anon;
grant execute on function public.get_exam_questions(uuid)
  to authenticated, service_role;

-- Hasil milik sendiri dibaca lewat RPC karena event_results membatasi akses
-- kolom untuk melindungi jawaban peserta lain.
create or replace function public.get_my_event_results(p_event_ids uuid[])
returns table (
  id uuid,
  event_id uuid,
  total integer,
  twk integer,
  tiu integer,
  tkp integer,
  finished_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select er.id, er.event_id, er.total, er.twk, er.tiu, er.tkp, er.finished_at
  from public.event_results er
  where er.user_id = auth.uid()
    and er.event_id = any(coalesce(p_event_ids, '{}'::uuid[]));
$$;

revoke all on function public.get_my_event_results(uuid[]) from public, anon;
grant execute on function public.get_my_event_results(uuid[])
  to authenticated, service_role;

-- 8. Pengingat otomatis ------------------------------------------------------

create or replace function public.notify_upcoming_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  -- H-6 jam
  with due as materialized (
    select r.id, r.user_id, e.title, e.start_date
    from public.event_registrations r
    join public.events e on e.id = r.event_id
    where e.is_active
      and e.start_date is not null
      and r.notified_6h_at is null
      and e.start_date - interval '6 hours' <= now()
      and e.start_date > now()
  ), ins as (
    insert into public.notifications (user_id, title, message, type, read)
    select
      d.user_id,
      'Tryout Akbar dimulai kurang dari 6 jam',
      'Event "' || d.title || '" dimulai pukul '
        || to_char(d.start_date at time zone 'Asia/Jakarta', 'HH24:MI')
        || ' WIB. Siapkan perangkat dan koneksi internetmu.',
      'event',
      false
    from due d
    returning 1
  ), upd as (
    update public.event_registrations r
    set notified_6h_at = now()
    where r.id in (select id from due)
    returning 1
  )
  select count(*) into v_count from ins;

  -- Tepat saat mulai
  with due as materialized (
    select r.id, r.user_id, e.title
    from public.event_registrations r
    join public.events e on e.id = r.event_id
    where e.is_active
      and e.start_date is not null
      and r.notified_start_at is null
      and e.start_date <= now()
      and e.start_date > now() - interval '30 minutes'
  ), ins as (
    insert into public.notifications (user_id, title, message, type, read)
    select
      d.user_id,
      'Tryout Akbar telah dimulai',
      'Event "' || d.title || '" sudah dibuka. Buka menu Event untuk mulai mengerjakan.',
      'event',
      false
    from due d
    returning 1
  ), upd as (
    update public.event_registrations r
    set notified_start_at = now()
    where r.id in (select id from due)
    returning 1
  )
  select v_count + count(*) into v_count from ins;

  return v_count;
end;
$$;

revoke all on function public.notify_upcoming_events() from public, anon, authenticated;
grant execute on function public.notify_upcoming_events() to service_role;

-- Fallback saat cron tidak tersedia: siswa memicu pengingatnya sendiri
-- ketika membuka halaman Event.
create or replace function public.claim_event_reminder()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user is null then
    return 0;
  end if;

  with due as materialized (
    select r.id, e.title, e.start_date
    from public.event_registrations r
    join public.events e on e.id = r.event_id
    where r.user_id = v_user
      and e.is_active
      and e.start_date is not null
      and r.notified_6h_at is null
      and e.start_date - interval '6 hours' <= now()
      and e.start_date > now()
  ), ins as (
    insert into public.notifications (user_id, title, message, type, read)
    select
      v_user,
      'Tryout Akbar dimulai kurang dari 6 jam',
      'Event "' || d.title || '" dimulai pukul '
        || to_char(d.start_date at time zone 'Asia/Jakarta', 'HH24:MI')
        || ' WIB. Siapkan perangkat dan koneksi internetmu.',
      'event',
      false
    from due d
    returning 1
  ), upd as (
    update public.event_registrations r
    set notified_6h_at = now()
    where r.id in (select id from due)
    returning 1
  )
  select count(*) into v_count from ins;

  return v_count;
end;
$$;

revoke all on function public.claim_event_reminder() from public, anon;
grant execute on function public.claim_event_reminder()
  to authenticated, service_role;

-- 9. Penutupan otomatis ------------------------------------------------------
-- Event dinonaktifkan setelah end_date lewat, dan sesi ujian yang sudah
-- berakhir dibersihkan. Hasil event (leaderboard) tetap disimpan.

create or replace function public.close_finished_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed integer := 0;
begin
  update public.events
  set is_active = false
  where is_active
    and end_date is not null
    and end_date < now();

  get diagnostics v_closed = row_count;

  delete from public.active_tryout_sessions s
  using public.events e
  where e.package_id = s.tryout_id
    and e.end_date is not null
    and e.end_date < now()
    and s.end_time < now();

  -- Simpan salinan event_results sebagai leaderboard, lalu hapus hasil mentah
  -- event setelah masa penyelesaian dan toleransi jaringan berakhir.
  delete from public.tryout_results tr
  using public.events e
  where e.package_id = tr.tryout_id
    and tr.package_id is null
    and e.end_date is not null
    and tr.created_at < e.end_date
      + make_interval(mins => greatest(coalesce(e.duration_minutes, 100), 1))
      + interval '1 hour'
    and exists (
      select 1
      from public.event_registrations er
      where er.event_id = e.id and er.user_id = tr.user_id
    );

  return v_closed;
end;
$$;

revoke all on function public.close_finished_events() from public, anon, authenticated;
grant execute on function public.close_finished_events() to service_role;

-- 10. Jadwalkan cron bila tersedia ------------------------------------------

do $$
declare
  r record;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron tidak aktif; pengingat memakai claim_event_reminder()';
  else
    for r in
      select jobid from cron.job
      where jobname in ('fbk-upcoming-events', 'fbk-close-events')
    loop
      perform cron.unschedule(r.jobid);
    end loop;

    perform cron.schedule(
      'fbk-upcoming-events',
      '*/10 * * * *',
      'select public.notify_upcoming_events();'
    );

    perform cron.schedule(
      'fbk-close-events',
      '7 * * * *',
      'select public.close_finished_events();'
    );
  end if;
exception when others then
  raise notice 'Gagal menjadwalkan cron: %', sqlerrm;
end $$;

notify pgrst, 'reload schema';

commit;
