-- Perbaikan: fungsi agregasi statistik menolak service_role karena hanya
-- memeriksa public.is_admin() (yang membaca klaim JWT pengguna). Akibatnya
-- pemanggilan server-side dan skrip uji gagal dengan "Hanya admin...".
--
-- Sekarang service_role juga diizinkan, sama seperti fungsi admin lain.

begin;

create or replace function public.admin_analytics_summary(p_days integer default 7)
returns table (
  event_name text,
  unique_sessions bigint,
  total_events bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 7), 365));
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Hanya admin yang dapat membaca statistik';
  end if;

  return query
  select
    e.name,
    count(distinct e.session_id)::bigint,
    count(*)::bigint
  from public.analytics_events e
  where e.created_at >= now() - make_interval(days => v_days)
  group by e.name;
end;
$$;

revoke all on function public.admin_analytics_summary(integer) from public, anon;
grant execute on function public.admin_analytics_summary(integer) to authenticated, service_role;

create or replace function public.admin_analytics_visitors(p_days integer default 7)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 7), 365));
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Hanya admin yang dapat membaca statistik';
  end if;

  return (
    select count(distinct e.session_id)::bigint
    from public.analytics_events e
    where e.created_at >= now() - make_interval(days => v_days)
      and e.session_id is not null
  );
end;
$$;

revoke all on function public.admin_analytics_visitors(integer) from public, anon;
grant execute on function public.admin_analytics_visitors(integer) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
