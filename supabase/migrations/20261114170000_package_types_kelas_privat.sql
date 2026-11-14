-- Tipe paket baru: KELAS (kuota terbatas, default 5 orang) dan PRIVAT (1-on-1).
-- Kuota ditegakkan di database supaya tidak bisa ditembus lewat panel.

begin;

-- 1. Kolom kuota dan jumlah kursi terisi.
alter table public.packages
  add column if not exists quota integer,
  add column if not exists seats_taken integer not null default 0;

-- Sinkronkan seats_taken dengan data yang sudah ada.
update public.packages p
set seats_taken = coalesce(sub.cnt, 0)
from (
  select package_id, count(*)::int as cnt
  from public.user_packages
  group by package_id
) sub
where p.id = sub.package_id;

update public.packages set seats_taken = 0 where seats_taken is null;

-- 2. Paket kelas selalu punya kuota. Default 5 orang bila admin tidak mengisi.
create or replace function public.default_class_quota()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_type = 'KELAS' and (new.quota is null or new.quota < 1) then
    new.quota := 5;
  end if;

  -- Tipe selain KELAS tidak dibatasi kuota.
  if new.product_type is distinct from 'KELAS' then
    new.quota := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_default_class_quota on public.packages;
create trigger trg_default_class_quota
  before insert or update on public.packages
  for each row
  execute function public.default_class_quota();

-- 3. Tolak pemberian paket bila kursi sudah penuh.
create or replace function public.enforce_package_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota integer;
  v_taken integer;
begin
  -- Serialkan pengecekan per paket agar dua admin tidak bisa mengisi kursi terakhir bersamaan.
  perform pg_advisory_xact_lock(hashtext('pkg_quota:' || new.package_id::text));

  select p.quota, p.seats_taken
  into v_quota, v_taken
  from public.packages p
  where p.id = new.package_id
  for update;

  if not found then
    raise exception 'Paket tidak ditemukan';
  end if;

  if v_quota is not null and v_taken >= v_quota then
    raise exception 'Kuota paket ini sudah penuh (% dari %)', v_taken, v_quota
      using errcode = 'check_violation';
  end if;

  update public.packages
  set seats_taken = seats_taken + 1
  where id = new.package_id;

  return new;
end;
$$;

drop trigger if exists trg_enforce_package_quota on public.user_packages;
create trigger trg_enforce_package_quota
  before insert on public.user_packages
  for each row
  execute function public.enforce_package_quota();

-- 4. Kembalikan kursi saat akses dicabut.
create or replace function public.release_package_seat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.packages
  set seats_taken = greatest(seats_taken - 1, 0)
  where id = old.package_id;

  return old;
end;
$$;

drop trigger if exists trg_release_package_seat on public.user_packages;
create trigger trg_release_package_seat
  after delete on public.user_packages
  for each row
  execute function public.release_package_seat();

revoke all on function public.enforce_package_quota() from public, anon, authenticated;
revoke all on function public.release_package_seat() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
