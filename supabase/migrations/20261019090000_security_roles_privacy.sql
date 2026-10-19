-- Security baseline: role source of truth + privacy hardening.
-- Safe to run more than once.

begin;

-- 1. Admin identity comes from app_metadata only. Never from a user-editable email.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Public catalog and CMS; write access remains admin-only.
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('packages', 'site_settings', 'tryout_packages')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "Public view active packages"
  on public.packages for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Admin manage packages"
  on public.packages for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public view settings"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "Admin manage settings"
  on public.site_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Authenticated view published tryouts"
  on public.tryout_packages for select to authenticated
  using (status = 'Published' or public.is_admin());

create policy "Public view published tryouts"
  on public.tryout_packages for select to anon
  using (status = 'Published');

create policy "Admin manage tryout packages"
  on public.tryout_packages for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Profiles are private. Public data goes through public_profiles.
revoke select on public.profiles from anon;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy "Users view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Admin manage all profiles"
  on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace view public.public_profiles as
select id, full_name, school
from public.profiles
where coalesce(is_public, true) = true;

revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

-- 3. Leaderboard without user_id or answers. Public/anon safe.
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
  coalesce(p.full_name, 'Siswa FBK') as full_name,
  (
    select count(*)::int
    from public.tryout_results r2
    where r2.user_id = r.user_id
      and r2.package_id = r.package_id
  ) as tryout_count
from public.tryout_results r
left join public.profiles p on p.id = r.user_id
where coalesce(p.is_public, true) = true
order by r.user_id, coalesce(r.tryout_id::text, r.package_name), r.created_at asc;

revoke all on public.leaderboard_public from public;
grant select on public.leaderboard_public to anon, authenticated;

-- The raw leaderboard view contains answers and user_id. Only server-side
-- functions may read it.
revoke select on public.fair_package_leaderboard from anon, authenticated;

-- 4. Paid package contents are not public. Owners and admins only.
revoke select on public.package_contents from anon;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'package_contents'
  loop
    execute format('drop policy if exists %I on public.package_contents', r.policyname);
  end loop;
end $$;

create policy "Users view own package contents"
  on public.package_contents for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.user_packages up
      where up.user_id = auth.uid()
        and up.package_id = package_contents.package_id
    )
  );

create policy "Admin manage contents"
  on public.package_contents for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Catalog only needs the number of contents per package.
create or replace view public.package_content_counts as
select package_id, count(*)::int as content_count
from public.package_contents
group by package_id;

revoke all on public.package_content_counts from public;
grant select on public.package_content_counts to anon, authenticated;

commit;
