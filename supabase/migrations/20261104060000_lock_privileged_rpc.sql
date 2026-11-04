-- Lock down privileged RPCs that were still executable by anon/authenticated
-- because Supabase default privileges grant EXECUTE on every new function.
--
-- grant_package() has no caller check: it marks a transaction as success and
-- grants the package. Any signed-in user could call it with their own pending
-- transaction and get paid access for free. Service role only.

begin;

revoke all on function public.grant_package(uuid) from public, anon, authenticated;
grant execute on function public.grant_package(uuid) to service_role;

-- Admin-only, with an internal is_admin() check. Never anon.
revoke all on function public.delete_user_by_admin(uuid) from public, anon;
grant execute on function public.delete_user_by_admin(uuid) to authenticated, service_role;

revoke all on function public.admin_get_questions(uuid) from public, anon;
grant execute on function public.admin_get_questions(uuid) to authenticated, service_role;

revoke all on function public.broadcast_notification(text, text, text) from public, anon;
grant execute on function public.broadcast_notification(text, text, text) to authenticated, service_role;

-- Internal/trigger functions: no client should call these directly.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'calculate_tryout_results_secure',
        'fbk_calculate_tryout_score',
        'fbk_handle_new_user',
        'handle_new_user',
        'notify_on_payment_status_change',
        'update_updated_at_column',
        'generate_referral_code',
        'is_fbk_admin'
      )
  loop
    begin
      execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    exception when undefined_function then null;
    end;
  end loop;
end;
$$;

-- is_admin() must stay callable by anon/authenticated because RLS policies use it.
grant execute on function public.is_admin() to anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
