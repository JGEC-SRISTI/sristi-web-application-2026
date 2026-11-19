-- PostgREST table privileges are separate from RLS policies. Grant the
-- anonymous role the read access required by the public-facing pages.
-- Existing RLS policies continue to control which rows are visible.
grant
    select on table public.events,
    public.event_files,
    public.fest_settings
to anon;
