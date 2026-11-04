-- active_tryout_sessions.flagged is jsonb (flagged question ids), not a counter.
-- Add a dedicated integer counter for anti-cheat and use it in the RPCs.

begin;

alter table public.active_tryout_sessions
  add column if not exists cheat_attempts integer not null default 0;

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
      cheat_attempts = greatest(coalesce(cheat_attempts, 0), coalesce(p_flagged, 0)),
      updated_at = now()
  where user_id = v_user
    and tryout_id = p_tryout_id;
end;
$$;

revoke all on function public.save_tryout_progress(uuid, jsonb, integer, integer) from public, anon;
grant execute on function public.save_tryout_progress(uuid, jsonb, integer, integer) to authenticated, service_role;

-- Recreate submission with the correct counter column.
create or replace function public.submit_tryout_secure(
  p_user_id uuid,
  p_package_id uuid,
  p_questions_id uuid,
  p_answers jsonb,
  p_cheat_attempts integer,
  p_package_name text
)
returns table (
  id uuid,
  twk integer,
  tiu integer,
  tkp integer,
  total integer,
  twk_correct integer,
  tiu_correct integer,
  tkp_correct integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_twk integer := 0;
  v_tiu integer := 0;
  v_tkp integer := 0;
  v_twk_correct integer := 0;
  v_tiu_correct integer := 0;
  v_tkp_correct integer := 0;
  v_total integer := 0;
  v_result_id uuid;
  v_details jsonb;
  v_package uuid;
  v_total_generated boolean;
  v_session_flagged integer := 0;
  v_session_end timestamptz;
  v_overtime integer := 0;
  v_flagged integer := 0;
begin
  if v_user is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Unauthorized';
  end if;

  if v_user is not null and v_user <> p_user_id then
    raise exception 'Akses ditolak';
  end if;

  if not exists (
    select 1 from public.tryout_packages tp where tp.id = p_questions_id
  ) then
    raise exception 'Paket tryout tidak ditemukan';
  end if;

  if not (
    public.is_admin()
    or coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1
      from public.user_packages up
      join public.package_contents pc on pc.package_id = up.package_id
      where up.user_id = p_user_id
        and pc.tryout_id = p_questions_id
    )
    or exists (
      select 1
      from public.events e
      where e.package_id = p_questions_id
        and e.is_active
        and (e.start_date is null or e.start_date <= now())
        and (e.end_date is null or e.end_date >= now())
    )
  ) then
    raise exception 'Anda tidak memiliki akses ke tryout ini';
  end if;

  select coalesce(s.cheat_attempts, 0), s.end_time
  into v_session_flagged, v_session_end
  from public.active_tryout_sessions s
  where s.user_id = p_user_id
    and s.tryout_id = p_questions_id;

  if v_session_end is not null and now() > v_session_end + interval '120 seconds' then
    v_overtime := 1;
  end if;

  v_flagged := greatest(coalesce(p_cheat_attempts, 0), v_session_flagged) + v_overtime;

  with scored as (
    select
      q.id,
      q.category,
      case
        when q.category in ('TWK', 'TIU') then
          case when (v_answers ->> q.id::text) = q.correct_answer then 5 else 0 end
        when q.category = 'TKP' then
          coalesce((q.tkp_scores ->> (v_answers ->> q.id::text))::integer, 0)
        else 0
      end as score,
      case
        when q.category in ('TWK', 'TIU') and (v_answers ->> q.id::text) = q.correct_answer then 1
        else 0
      end as is_correct,
      case
        when q.category = 'TKP' and (v_answers ->> q.id::text) is not null then 1
        else 0
      end as is_answered
    from public.tryout_questions q
    where q.package_id = p_questions_id
  )
  select
    coalesce(sum(score) filter (where category = 'TWK'), 0)::integer,
    coalesce(sum(score) filter (where category = 'TIU'), 0)::integer,
    coalesce(sum(score) filter (where category = 'TKP'), 0)::integer,
    coalesce(sum(is_correct) filter (where category = 'TWK'), 0)::integer,
    coalesce(sum(is_correct) filter (where category = 'TIU'), 0)::integer,
    coalesce(sum(is_answered) filter (where category = 'TKP'), 0)::integer
  into v_twk, v_tiu, v_tkp, v_twk_correct, v_tiu_correct, v_tkp_correct
  from scored;

  v_total := v_twk + v_tiu + v_tkp;

  select jsonb_agg(
    jsonb_build_object(
      'questionId', q.id,
      'category', q.category,
      'userAnswer', v_answers ->> q.id::text,
      'correctAnswer', q.correct_answer,
      'score', case
        when q.category in ('TWK', 'TIU') then
          case when (v_answers ->> q.id::text) = q.correct_answer then 5 else 0 end
        when q.category = 'TKP' then
          coalesce((q.tkp_scores ->> (v_answers ->> q.id::text))::integer, 0)
        else 0
      end
    )
    order by q.number
  )
  into v_details
  from public.tryout_questions q
  where q.package_id = p_questions_id;

  select up.package_id into v_package
  from public.user_packages up
  join public.package_contents pc on pc.package_id = up.package_id
  where up.user_id = p_user_id
    and pc.tryout_id = p_questions_id
  order by up.activated_at desc nulls last
  limit 1;

  if v_package is null and (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    select p.id into v_package
    from public.packages p
    where p.id = p_package_id;
  end if;

  select a.attgenerated = 's' into v_total_generated
  from pg_attribute a
  where a.attrelid = 'public.tryout_results'::regclass
    and a.attname = 'total'
    and not a.attisdropped;

  if coalesce(v_total_generated, false) then
    insert into public.tryout_results as inserted (
      user_id, package_id, tryout_id, package_name,
      twk, tiu, tkp, twk_correct, tiu_correct, tkp_correct,
      answers, score_details, date, cheat_attempts
    )
    values (
      p_user_id, v_package, p_questions_id,
      coalesce(nullif(trim(p_package_name), ''), 'Tryout SKD'),
      v_twk, v_tiu, v_tkp, v_twk_correct, v_tiu_correct, v_tkp_correct,
      v_answers, v_details, now(), greatest(v_flagged, 0)
    )
    returning inserted.id into v_result_id;
  else
    insert into public.tryout_results as inserted (
      user_id, package_id, tryout_id, package_name,
      twk, tiu, tkp, total, twk_correct, tiu_correct, tkp_correct,
      answers, score_details, date, cheat_attempts
    )
    values (
      p_user_id, v_package, p_questions_id,
      coalesce(nullif(trim(p_package_name), ''), 'Tryout SKD'),
      v_twk, v_tiu, v_tkp, v_total, v_twk_correct, v_tiu_correct, v_tkp_correct,
      v_answers, v_details, now(), greatest(v_flagged, 0)
    )
    returning inserted.id into v_result_id;
  end if;

  delete from public.active_tryout_sessions
  where user_id = p_user_id
    and tryout_id = p_questions_id;

  return query select
    v_result_id, v_twk, v_tiu, v_tkp, v_total,
    v_twk_correct, v_tiu_correct, v_tkp_correct;
end;
$$;

revoke all on function public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text)
  from public, anon;
grant execute on function public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text)
  to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
