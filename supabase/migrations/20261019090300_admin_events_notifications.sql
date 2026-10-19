-- Admin, events, notifications, and leaderboard rank fixes.
-- Safe to run more than once.

begin;

-- 1. Notifications (live schema uses "read").
alter table public.notifications
  add column if not exists type text default 'info',
  add column if not exists read boolean default false;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'notifications'
  loop
    execute format('drop policy if exists %I on public.notifications', r.policyname);
  end loop;
end $$;

create policy "Users view own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin manage notifications"
  on public.notifications for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Broadcast (previously referenced a non-existent table).
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

revoke all on function public.broadcast_notification(text, text, text) from public;
grant execute on function public.broadcast_notification(text, text, text) to authenticated;

-- 2b. Admin-only user deletion.
create or replace function public.delete_user_by_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang bisa menghapus user';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_user_by_admin(uuid) from public;
grant execute on function public.delete_user_by_admin(uuid) to authenticated;

-- 3. Events: admins manage events, not service_role only.
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'events'
  loop
    execute format('drop policy if exists %I on public.events', r.policyname);
  end loop;
end $$;

create policy "events_select_all"
  on public.events for select to anon, authenticated
  using (true);

create policy "events_insert_admin"
  on public.events for insert to authenticated
  with check (public.is_admin());

create policy "events_update_admin"
  on public.events for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "events_delete_admin"
  on public.events for delete to authenticated
  using (public.is_admin());

-- 4. Event results: never expose other users' answers.
revoke select (answers) on public.event_results from anon, authenticated;
revoke insert on public.event_results from anon, authenticated;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'event_results'
  loop
    execute format('drop policy if exists %I on public.event_results', r.policyname);
  end loop;
end $$;

create policy "event_results_select_all"
  on public.event_results for select to authenticated
  using (true);

create policy "event_results_delete_admin"
  on public.event_results for delete to authenticated
  using (public.is_admin());

-- 5. Safe event leaderboard (no answers).
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

revoke all on function public.get_event_leaderboard(uuid) from public;
grant execute on function public.get_event_leaderboard(uuid) to authenticated;

-- 6. Event submission copies the server-scored tryout result.
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

revoke all on function public.submit_event_result(uuid, uuid) from public;
grant execute on function public.submit_event_result(uuid, uuid) to authenticated;

-- 7. User rank without exposing the raw leaderboard view.
create or replace function public.get_user_rank(
  target_user_id uuid,
  target_package_id uuid default null
)
returns table (
  rank_position bigint,
  total_participants bigint,
  score integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      l.user_id,
      l.total,
      rank() over (order by l.total desc) as pos,
      count(*) over () as total_count
    from public.fair_package_leaderboard l
    where target_package_id is null or l.package_id = target_package_id
  )
  select pos, total_count, total
  from ranked
  where user_id = target_user_id;
$$;

revoke all on function public.get_user_rank(uuid, uuid) from public;
grant execute on function public.get_user_rank(uuid, uuid) to authenticated, anon;

commit;
