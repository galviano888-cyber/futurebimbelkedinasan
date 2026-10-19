-- Tryout integrity: server-side scoring, safe exam payload, review access.
-- Safe to run more than once.

begin;

-- 1. Compatibility columns used by the application.
alter table public.tryout_questions
  add column if not exists sub_category text,
  add column if not exists option_images jsonb,
  add column if not exists options_image_url jsonb;

alter table public.tryout_packages
  add column if not exists duration_minutes integer default 100,
  add column if not exists passing_grade_twk integer default 65,
  add column if not exists passing_grade_tiu integer default 80,
  add column if not exists passing_grade_tkp integer default 166,
  add column if not exists updated_at timestamptz default now();

alter table public.package_contents
  add column if not exists live_schedule text,
  add column if not exists schedule_text text,
  add column if not exists is_bonus boolean default false;

alter table public.tryout_results
  add column if not exists cheat_attempts integer default 0;

-- Results are written by submit_tryout_secure only.
revoke insert, update, delete on public.tryout_results from anon, authenticated;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'tryout_results'
  loop
    execute format('drop policy if exists %I on public.tryout_results', r.policyname);
  end loop;
end $$;

create policy "Users view own results"
  on public.tryout_results for select to authenticated
  using (auth.uid() = user_id);

create policy "Admin manage all results"
  on public.tryout_results for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Answer keys are never readable by students.
-- Table-level SELECT must be revoked first; column-level revoke alone is a no-op.
revoke select on public.tryout_questions from anon, authenticated;
grant select (
  id, package_id, number, category, sub_category,
  question_text, question_image_url, options,
  options_image_url, option_images, created_at
) on public.tryout_questions to authenticated;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'tryout_questions'
  loop
    execute format('drop policy if exists %I on public.tryout_questions', r.policyname);
  end loop;
end $$;

create policy "Users view questions if they have access"
  on public.tryout_questions for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.user_packages up
      join public.package_contents pc on pc.package_id = up.package_id
      where up.user_id = auth.uid()
        and pc.tryout_id = tryout_questions.package_id
    )
    or exists (
      select 1
      from public.events e
      where e.package_id = tryout_questions.package_id
        and e.is_active
        and (e.start_date is null or e.start_date <= now())
        and (e.end_date is null or e.end_date >= now())
    )
  );

create policy "Admin manage all questions"
  on public.tryout_questions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Safe exam payload (no answer keys).
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
        from public.events e
        where e.package_id = p_tryout_id
          and e.is_active
          and (e.start_date is null or e.start_date <= now())
          and (e.end_date is null or e.end_date >= now())
      )
    )
  order by q.number;
$$;

revoke all on function public.get_exam_questions(uuid) from public;
grant execute on function public.get_exam_questions(uuid) to authenticated, service_role;

-- Question counts for the admin bank-soal list, without exposing answer keys.
create or replace view public.tryout_question_counts as
select package_id, count(*)::int as question_count
from public.tryout_questions
group by package_id;

revoke all on public.tryout_question_counts from public;
grant select on public.tryout_question_counts to anon, authenticated;

-- 4. Admin question editor payload.
create or replace function public.admin_get_questions(p_package_id uuid)
returns setof public.tryout_questions
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Akses ditolak';
  end if;

  return query
  select q.*
  from public.tryout_questions q
  where q.package_id = p_package_id
  order by q.number;
end;
$$;

revoke all on function public.admin_get_questions(uuid) from public;
grant execute on function public.admin_get_questions(uuid) to authenticated, service_role;

-- 5. Review only for the owner of the result.
drop function if exists public.get_tryout_review(uuid);

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
    q.question_text,
    q.question_image_url,
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

revoke all on function public.get_tryout_review(uuid) from public;
grant execute on function public.get_tryout_review(uuid) to authenticated, service_role;

-- 6. Server-side submission. Replaces the untracked production function.
drop function if exists public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text);

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
    insert into public.tryout_results (
      user_id, package_id, tryout_id, package_name,
      twk, tiu, tkp, twk_correct, tiu_correct, tkp_correct,
      answers, score_details, date, cheat_attempts
    )
    values (
      p_user_id, v_package, p_questions_id,
      coalesce(nullif(trim(p_package_name), ''), 'Tryout SKD'),
      v_twk, v_tiu, v_tkp, v_twk_correct, v_tiu_correct, v_tkp_correct,
      v_answers, v_details, now(), greatest(coalesce(p_cheat_attempts, 0), 0)
    )
    returning id into v_result_id;
  else
    insert into public.tryout_results (
      user_id, package_id, tryout_id, package_name,
      twk, tiu, tkp, total, twk_correct, tiu_correct, tkp_correct,
      answers, score_details, date, cheat_attempts
    )
    values (
      p_user_id, v_package, p_questions_id,
      coalesce(nullif(trim(p_package_name), ''), 'Tryout SKD'),
      v_twk, v_tiu, v_tkp, v_total, v_twk_correct, v_tiu_correct, v_tkp_correct,
      v_answers, v_details, now(), greatest(coalesce(p_cheat_attempts, 0), 0)
    )
    returning id into v_result_id;
  end if;

  return query select
    v_result_id, v_twk, v_tiu, v_tkp, v_total,
    v_twk_correct, v_tiu_correct, v_tkp_correct;
end;
$$;

revoke all on function public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text) from public;
grant execute on function public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text)
  to authenticated, service_role;

-- Scoring is now authoritative in submit_tryout_secure.
drop trigger if exists trg_auto_score on public.tryout_results;

commit;
