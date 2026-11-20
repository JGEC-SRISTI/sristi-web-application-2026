-- PostgREST table privileges are separate from RLS policies. Grant only the
-- operations used by the authenticated admin UI; RLS still limits every row.
grant
    select on table public.profiles,
    public.admin_users,
    public.payment_records,
    public.verification_codes,
    public.fest_settings,
    public.events,
    public.registrations,
    public.teams,
    public.team_members,
    public.attendance,
    public.results
to authenticated;

-- Events and festival settings are edited directly by the admin UI. The
-- corresponding RLS policies continue to require an active admin.
grant
    insert,
    update,
    delete on table public.events,
    public.fest_settings
to authenticated;
