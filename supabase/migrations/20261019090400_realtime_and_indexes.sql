-- Realtime publication and query indexes.
-- Safe to run more than once.

begin;

create index if not exists idx_transactions_user_status
  on public.transactions(user_id, status, created_at desc);

create index if not exists idx_tryout_results_user_package
  on public.tryout_results(user_id, package_id, created_at desc);

create index if not exists idx_user_packages_user
  on public.user_packages(user_id);

create index if not exists idx_notifications_user_read
  on public.notifications(user_id, read, created_at desc);

create index if not exists idx_event_results_event_total
  on public.event_results(event_id, total desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.transactions;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.tryout_results;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;

commit;
