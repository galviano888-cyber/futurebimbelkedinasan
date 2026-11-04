-- Server-side tryout sessions + privacy masking for public leaderboards.
-- Also removes an unused empty table.

begin;

-- 1. Sessions: one active row per user per tryout.
delete from public.active_tryout_sessions a
using public.active_tryout_sessions b
where a.user_id = b.user_id
  and a.tryout_id = b.tryout_id
  and a.created_at < b.created_at;

create unique index if not exists active_tryout_sessions_user_tryout_uidx
  on public.active_tryout_sessions(user_id, tryout_id);

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname='public' and tablename='active_tryout_sessions'
  loop
    execute format('drop policy if exists %I on public.active_tryout_sessions', r.policyname);
  end loop;
end $$;

create policy "Users manage own tryout session"
  on public.active_tryout_sessions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin manage tryout sessions"
  on public.active_tryout_sessions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Start (or resume) a session. Duration comes from the database, never the client.
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

-- 3. Autosave progress so a refresh or a dead battery does not erase work.
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
begin
  if v_user is null then
    raise exception 'Unauthorized';
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

-- 4. Name masking for anonymous visitors.
create or replace function public.mask_full_name(p_name text)
returns text
language sql
immutable
as $$
  select case
    when p_name is null or btrim(p_name) = '' then 'Siswa FBK'
    when array_length(string_to_array(btrim(p_name), ' '), 1) > 1 then
      split_part(btrim(p_name), ' ', 1) || ' ' || left(split_part(btrim(p_name), ' ', 2), 1) || '.'
    when length(btrim(p_name)) <= 3 then btrim(p_name)
    else left(btrim(p_name), 3) || '***'
  end
$$;

revoke all on function public.mask_full_name(text) from public;
grant execute on function public.mask_full_name(text) to anon, authenticated, service_role;

create or replace view public.leaderboard_public as
select distinct on (r.user_id, coalesce(r.tryout_id::text, r.package_name))
  r.package_id,
  r.tryout_id,
  r.package_name,
  r.twk,
  r.tiu,
  r.tkp,
  r.total,
  r.date,
  case
    when auth.role() = 'authenticated' then coalesce(p.full_name::text, 'Siswa FBK')
    else public.mask_full_name(p.full_name::text)
  end as full_name,
  (
    select count(*)::int
    from public.tryout_results r2
    where r2.user_id = r.user_id
      and r2.package_id = r.package_id
  ) as tryout_count
from public.tryout_results r
left join public.profiles p on p.id = r.user_id
where coalesce(p.is_public, false) = true
order by r.user_id, coalesce(r.tryout_id::text, r.package_name), r.created_at asc;

revoke all on public.leaderboard_public from public;
grant select on public.leaderboard_public to anon, authenticated;

create or replace view public.public_profiles as
select
  id,
  case
    when auth.role() = 'authenticated' then full_name
    else public.mask_full_name(full_name)
  end as full_name,
  case when auth.role() = 'authenticated' then school else null end as school
from public.profiles
where coalesce(is_public, false) = true;

revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

-- 5. Drop an unused empty table.
drop table if exists public.package_schedules;

notify pgrst, 'reload schema';

commit;
