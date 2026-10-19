-- Revoke default PUBLIC/anon execution from private and write RPCs.
begin;

revoke all on function public.broadcast_notification(text, text, text) from public, anon;
revoke all on function public.claim_free_package(uuid) from public, anon;
revoke all on function public.create_order(uuid) from public, anon;
revoke all on function public.get_event_leaderboard(uuid) from public, anon;
revoke all on function public.get_exam_questions(uuid) from public, anon;
revoke all on function public.get_tryout_review(uuid) from public, anon;
revoke all on function public.get_user_rank(uuid, uuid) from public, anon;
revoke all on function public.submit_event_result(uuid, uuid) from public, anon;
revoke all on function public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text) from public, anon;

-- Authenticated access is granted narrowly per function.
grant execute on function public.broadcast_notification(text, text, text) to authenticated;
grant execute on function public.claim_free_package(uuid) to authenticated;
grant execute on function public.create_order(uuid) to authenticated;
grant execute on function public.get_event_leaderboard(uuid) to authenticated;
grant execute on function public.get_exam_questions(uuid) to authenticated;
grant execute on function public.get_tryout_review(uuid) to authenticated;
grant execute on function public.get_user_rank(uuid, uuid) to authenticated;
grant execute on function public.submit_event_result(uuid, uuid) to authenticated;
grant execute on function public.submit_tryout_secure(uuid, uuid, uuid, jsonb, integer, text) to authenticated;

notify pgrst, 'reload schema';
commit;
