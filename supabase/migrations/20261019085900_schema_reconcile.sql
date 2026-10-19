-- Reconcile the manually-created live schema into migration-managed tables.
-- This migration is additive and does not delete existing rows.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  phone_number text,
  whatsapp text,
  school text,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.tryout_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'SKD',
  duration_minutes integer default 100,
  passing_grade_twk integer default 65,
  passing_grade_tiu integer default 80,
  passing_grade_tkp integer default 166,
  status text default 'Draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tryout_questions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.tryout_packages(id) on delete cascade,
  number integer not null,
  category text not null,
  sub_category text,
  question_text text not null,
  question_image_url text,
  options jsonb not null default '{}'::jsonb,
  options_image_url jsonb,
  option_images jsonb,
  correct_answer text,
  tkp_scores jsonb,
  explanation text,
  fast_tips text,
  created_at timestamptz default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price integer not null default 0,
  original_price integer default 0,
  product_type text default 'SATUAN',
  category text,
  image_url text,
  cover_image_url text,
  is_active boolean default true,
  guide_url text,
  guide_text text,
  created_at timestamptz default now()
);

create table if not exists public.package_contents (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.packages(id) on delete cascade,
  type text not null,
  title text not null,
  url text,
  tryout_id uuid references public.tryout_packages(id) on delete set null,
  zoom_link text,
  recording_url text,
  content_date text,
  schedule_date text,
  live_schedule text,
  schedule_text text,
  mentor_name text,
  is_bonus boolean default false,
  order_index integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  amount integer not null,
  price_snapshot integer,
  status text default 'pending',
  invoice_id text unique,
  payment_method text default 'manual_transfer',
  payment_proof_url text,
  pakasir_data jsonb,
  snap_token text,
  order_id text,
  notes text,
  expiry_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete cascade,
  transaction_id uuid references public.transactions(id),
  activated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, package_id)
);

create table if not exists public.tryout_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  tryout_id uuid references public.tryout_packages(id) on delete set null,
  package_name text,
  twk integer default 0,
  tiu integer default 0,
  tkp integer default 0,
  twk_correct integer default 0,
  tiu_correct integer default 0,
  tkp_correct integer default 0,
  total integer default 0,
  answers jsonb,
  score_details jsonb,
  cheat_attempts integer default 0,
  date timestamptz default now(),
  created_at timestamptz default now()
);

do $$
declare
  v_generated char;
begin
  select a.attgenerated into v_generated
  from pg_attribute a
  where a.attrelid = 'public.tryout_results'::regclass
    and a.attname = 'total'
    and not a.attisdropped;

  if coalesce(v_generated, '') = 's' then
    alter table public.tryout_results alter column total drop expression;
    alter table public.tryout_results alter column total set default 0;
  end if;
end;
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  package_id uuid references public.tryout_packages(id) on delete set null,
  is_active boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  duration_minutes integer not null default 90,
  created_at timestamptz not null default now()
);

create table if not exists public.event_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total integer not null default 0,
  twk integer not null default 0,
  tiu integer not null default 0,
  tkp integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  score_details jsonb,
  finished_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Add columns that may be absent on an older manually-created schema.
alter table public.profiles
  add column if not exists phone text,
  add column if not exists phone_number text,
  add column if not exists whatsapp text,
  add column if not exists school text,
  add column if not exists is_public boolean default true;

alter table public.tryout_packages
  add column if not exists category text default 'SKD',
  add column if not exists duration_minutes integer default 100,
  add column if not exists passing_grade_twk integer default 65,
  add column if not exists passing_grade_tiu integer default 80,
  add column if not exists passing_grade_tkp integer default 166,
  add column if not exists status text default 'Draft',
  add column if not exists updated_at timestamptz default now();

alter table public.tryout_questions
  add column if not exists sub_category text,
  add column if not exists question_image_url text,
  add column if not exists options jsonb default '{}'::jsonb,
  add column if not exists options_image_url jsonb,
  add column if not exists option_images jsonb,
  add column if not exists correct_answer text,
  add column if not exists tkp_scores jsonb,
  add column if not exists explanation text,
  add column if not exists fast_tips text;

alter table public.packages
  add column if not exists original_price integer default 0,
  add column if not exists product_type text default 'SATUAN',
  add column if not exists category text,
  add column if not exists image_url text,
  add column if not exists cover_image_url text,
  add column if not exists is_active boolean default true,
  add column if not exists guide_url text,
  add column if not exists guide_text text;

alter table public.package_contents
  add column if not exists tryout_id uuid references public.tryout_packages(id) on delete set null,
  add column if not exists zoom_link text,
  add column if not exists recording_url text,
  add column if not exists content_date text,
  add column if not exists schedule_date text,
  add column if not exists live_schedule text,
  add column if not exists schedule_text text,
  add column if not exists mentor_name text,
  add column if not exists is_bonus boolean default false,
  add column if not exists order_index integer default 0;

alter table public.transactions
  add column if not exists price_snapshot integer,
  add column if not exists payment_method text default 'manual_transfer',
  add column if not exists pakasir_data jsonb,
  add column if not exists snap_token text,
  add column if not exists order_id text,
  add column if not exists notes text,
  add column if not exists expiry_date timestamptz,
  add column if not exists updated_at timestamptz default now();

alter table public.user_packages
  add column if not exists transaction_id uuid references public.transactions(id),
  add column if not exists activated_at timestamptz default now();

alter table public.tryout_results
  add column if not exists package_id uuid references public.packages(id) on delete set null,
  add column if not exists tryout_id uuid references public.tryout_packages(id) on delete set null,
  add column if not exists package_name text,
  add column if not exists twk_correct integer default 0,
  add column if not exists tiu_correct integer default 0,
  add column if not exists tkp_correct integer default 0,
  add column if not exists answers jsonb,
  add column if not exists score_details jsonb,
  add column if not exists cheat_attempts integer default 0,
  add column if not exists created_at timestamptz default now();

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.package_contents enable row level security;
alter table public.tryout_packages enable row level security;
alter table public.tryout_questions enable row level security;
alter table public.transactions enable row level security;
alter table public.user_packages enable row level security;
alter table public.tryout_results enable row level security;
alter table public.events enable row level security;
alter table public.event_results enable row level security;
alter table public.notifications enable row level security;
alter table public.site_settings enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.packages, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.package_contents to authenticated;
grant select, insert, update, delete on public.tryout_packages to authenticated;
grant select, insert, update, delete on public.tryout_questions to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.user_packages to authenticated;
grant select, insert, update, delete on public.tryout_results to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_results to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.packages, public.site_settings, public.profiles,
  public.package_contents, public.tryout_packages, public.tryout_questions,
  public.transactions, public.user_packages, public.tryout_results,
  public.events, public.event_results, public.notifications to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    execute 'create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()';
  end if;
end;
$$;

-- Create the raw view only on fresh databases. Existing live views are retained.
do $$
begin
  if to_regclass('public.fair_package_leaderboard') is null then
    execute $view$
      create view public.fair_package_leaderboard as
      select distinct on (r.user_id, coalesce(r.tryout_id::text, r.package_id::text, r.package_name))
        r.id, r.user_id, r.package_id, r.tryout_id, r.package_name,
        r.twk, r.tiu, r.tkp, r.total, r.answers, r.score_details,
        r.date, r.created_at
      from public.tryout_results r
      order by r.user_id, coalesce(r.tryout_id::text, r.package_id::text, r.package_name), r.created_at asc
    $view$;
  end if;
end;
$$;

commit;
