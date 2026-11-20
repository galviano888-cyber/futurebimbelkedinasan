-- Optional banner artwork for Tryout Akbar event cards.
begin;

alter table public.events
  add column if not exists header_image_url text;

comment on column public.events.header_image_url is
  'Optional public image URL used as the visual header on event cards.';

notify pgrst, 'reload schema';
commit;
