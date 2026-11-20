-- Keep one current brochure per event and allow the admin UI to manage its
-- metadata through PostgREST while RLS continues to enforce authorization.
create unique index if not exists event_files_one_brochure_per_event
on public.event_files (event_id)
where file_type = 'brochure';

grant
    select on table public.event_files
to anon, authenticated;

grant
    insert,
    update,
    delete on table public.event_files
to authenticated;
