-- Kode siswa unik agar admin bisa mencari siswa tanpa mengandalkan nama/email.
-- Format: FBK-0001, FBK-0002, ...

begin;

create sequence if not exists public.student_code_seq;

alter table public.profiles
  add column if not exists student_code text;

-- Isi kode untuk siswa yang sudah ada, urut tanggal daftar.
with numbered as (
  select id, row_number() over (order by created_at nulls last, id) as rn
  from public.profiles
  where student_code is null
)
update public.profiles p
set student_code = 'FBK-' || lpad(n.rn::text, 4, '0')
from numbered n
where p.id = n.id;

-- Sequence harus melanjutkan setelah nomor terakhir yang dipakai.
select setval(
  'public.student_code_seq',
  coalesce((select max(substring(student_code from 5)::int) from public.profiles), 0) + 1,
  false
);

alter table public.profiles
  alter column student_code set default 'FBK-' || lpad(nextval('public.student_code_seq')::text, 4, '0');

alter table public.profiles
  alter column student_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_student_code_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_student_code_key unique (student_code);
  end if;
end $$;

create index if not exists idx_profiles_student_code
  on public.profiles(student_code);

-- Cari siswa berdasarkan kode, nama, atau email. Dipakai panel admin.
create or replace function public.admin_search_students(p_query text, p_limit integer default 20)
returns table(
  id uuid,
  student_code text,
  full_name text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q text := lower(trim(coalesce(p_query, '')));
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencari data siswa';
  end if;

  return query
  select p.id, p.student_code, p.full_name, p.email, p.created_at
  from public.profiles p
  where v_q = ''
     or lower(coalesce(p.student_code, '')) like '%' || v_q || '%'
     or lower(coalesce(p.full_name, '')) like '%' || v_q || '%'
     or lower(coalesce(p.email, '')) like '%' || v_q || '%'
  order by p.created_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 20), 100));
end;
$$;

revoke all on function public.admin_search_students(text, integer) from public, anon;
grant execute on function public.admin_search_students(text, integer) to authenticated;

notify pgrst, 'reload schema';

commit;
