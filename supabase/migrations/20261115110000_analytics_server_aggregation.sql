-- BUG: panel Statistik membaca `analytics_events` langsung dari browser dengan
-- `.limit(50000)`, tetapi PostgREST membatasi maksimal 1000 baris per query.
-- Terbukti: 1100 baris disisipkan, `limit=50000` hanya mengembalikan 1000.
-- Akibatnya funnel dan "pengunjung unik" salah begitu data melewati 1000 event
-- pada rentang yang dipilih.
--
-- Perbaikan: agregasi dilakukan di server, sehingga jumlah baris mentah tidak
-- lagi menjadi batas. Panel hanya menerima ringkasan kecil.

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
  if not public.is_admin() then
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
grant execute on function public.admin_analytics_summary(integer) to authenticated;

-- Total pengunjung unik (semua event) pada rentang yang sama.
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
  if not public.is_admin() then
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
grant execute on function public.admin_analytics_visitors(integer) to authenticated;

notify pgrst, 'reload schema';

commit;
