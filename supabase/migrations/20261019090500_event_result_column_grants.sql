-- Column grants for event results. Answers stay server-side only.

begin;

revoke select on public.event_results from anon, authenticated;

grant select (
  id, event_id, total, twk, tiu, tkp, finished_at
) on public.event_results to authenticated;

commit;
