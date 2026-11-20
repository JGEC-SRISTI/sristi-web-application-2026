begin;

-- Serialize team creation and joining per user/event, then enforce the
-- one-team-per-event rule inside the database rather than relying on the UI.
create or replace function public.create_team(
    p_event_id uuid,
    p_team_name text,
    p_member_info_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_team_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    if not public.is_verified_user() then
        raise exception 'User is not verified';
    end if;

    if not coalesce(p_member_info_consent, false) then
        raise exception 'Member information consent is required';
    end if;

    if not exists (
        select 1
        from public.events
        where id = p_event_id
          and event_type = 'team'
    ) then
        raise exception 'Invalid team event';
    end if;

    if p_team_name is null or trim(p_team_name) = '' then
        raise exception 'Team name cannot be empty';
    end if;

    -- Use the same lock key as join_team so concurrent create/join requests
    -- for this user and event cannot both pass the membership check.
    perform pg_advisory_xact_lock(
        hashtextextended(auth.uid()::text || ':' || p_event_id::text, 0)
    );

    if exists (
        select 1
        from public.team_members tm
        join public.teams t on t.id = tm.team_id
        where tm.user_id = auth.uid()
          and t.event_id = p_event_id
    ) then
        raise exception 'User is already a member of a team for this event';
    end if;

    if exists (
        select 1
        from public.teams
        where event_id = p_event_id
          and team_name = trim(p_team_name)
    ) then
        raise exception 'A team with this name already exists for this event';
    end if;

    insert into public.teams (event_id, team_name, team_code, leader_id, status)
    values (p_event_id, trim(p_team_name), public.generate_team_code(), auth.uid(), 'forming')
    returning id into v_team_id;

    insert into public.team_members (team_id, user_id, member_info_consent)
    values (v_team_id, auth.uid(), true);

    return v_team_id;
end;
$$;

revoke execute on function public.create_team(uuid, text) from public, anon, authenticated;
revoke execute on function public.create_team(uuid, text, boolean) from public, anon;
grant execute on function public.create_team(uuid, text, boolean) to authenticated;

commit;
