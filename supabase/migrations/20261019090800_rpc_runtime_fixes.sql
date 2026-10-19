-- Fix runtime RPC type mismatches and privacy defaults discovered after rollout.
begin;

create or replace view public.public_profiles as
select id, full_name, school
from public.profiles
where coalesce(is_public, false) = true;

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
  coalesce(p.full_name::text, 'Siswa FBK') as full_name,
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

create or replace function public.get_tryout_review(p_result_id uuid)
returns table (
  id uuid,
  category text,
  number integer,
  sub_category text,
  question_text text,
  question_image_url text,
  options jsonb,
  options_image_url jsonb,
  option_images jsonb,
  correct_answer text,
  explanation text,
  fast_tips text,
  tkp_scores jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.tryout_results r
    where r.id = p_result_id and r.user_id = auth.uid()
  ) and not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Akses ditolak';
  end if;

  return query
  select
    q.id,
    q.category::text,
    q.number,
    q.sub_category::text,
    q.question_text::text,
    q.question_image_url::text,
    q.options,
    q.options_image_url,
    q.option_images,
    q.correct_answer::text,
    q.explanation::text,
    q.fast_tips::text,
    q.tkp_scores
  from public.tryout_questions q
  join public.tryout_results r on r.tryout_id = q.package_id
  where r.id = p_result_id
  order by q.number;
end;
$$;

create or replace function public.broadcast_notification(
  title text,
  message text,
  type text default 'info'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak';
  end if;
  if nullif(trim(title), '') is null or nullif(trim(message), '') is null then
    raise exception 'Judul dan pesan wajib diisi';
  end if;
  insert into public.notifications (user_id, title, message, type, read)
  select p.id, title, message, coalesce(nullif(type, ''), 'info'), false
  from public.profiles p;
end;
$$;

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
    coalesce(p.full_name::text, 'Siswa FBK') as full_name,
    er.total,
    er.twk,
    er.tiu,
    er.tkp,
    er.finished_at
  from public.event_results er
  left join public.profiles p on p.id = er.user_id
  where er.event_id = p_event_id
    and coalesce(p.is_public, false) = true
  order by er.total desc
  limit 50;
$$;

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
  v_event public.events%rowtype;
  v_result public.tryout_results%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select e.* into v_event from public.events e where e.id = p_event_id;
  if not found then
    raise exception 'Event tidak ditemukan';
  end if;

  if not v_event.is_active
     or (v_event.start_date is not null and v_event.start_date > now())
     or (v_event.end_date is not null and v_event.end_date < now()) then
    raise exception 'Event tidak aktif';
  end if;

  select r.* into v_result
  from public.tryout_results r
  where r.id = p_result_id and r.user_id = auth.uid();

  if not found then
    raise exception 'Hasil tryout tidak ditemukan';
  end if;

  if v_result.tryout_id is distinct from v_event.package_id then
    raise exception 'Hasil tryout tidak cocok dengan event';
  end if;

  if (v_event.start_date is not null and v_result.created_at < v_event.start_date)
     or (v_event.end_date is not null and v_result.created_at > v_event.end_date) then
    raise exception 'Hasil tryout dibuat di luar periode event';
  end if;

  insert into public.event_results (
    event_id, user_id, total, twk, tiu, tkp, answers, score_details, finished_at
  )
  values (
    p_event_id, auth.uid(), v_result.total, v_result.twk, v_result.tiu, v_result.tkp,
    v_result.answers, v_result.score_details, now()
  )
  on conflict (event_id, user_id) do nothing;
end;
$$;

revoke select on public.event_results from authenticated;
grant select (id, event_id, total, twk, tiu, tkp, finished_at)
  on public.event_results to authenticated;

revoke all on function public.get_event_leaderboard(uuid) from public;
grant execute on function public.get_event_leaderboard(uuid) to authenticated;

revoke all on function public.get_tryout_review(uuid) from public;
grant execute on function public.get_tryout_review(uuid) to authenticated, service_role;

revoke all on function public.submit_event_result(uuid, uuid) from public;
grant execute on function public.submit_event_result(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
