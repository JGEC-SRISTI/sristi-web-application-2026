begin;

-- Keep a team open after it reaches its minimum size. The team leader uses
-- finalize_team_registration() from the app when the roster is ready.
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

create or replace function public.join_team(
    p_team_code text,
    p_member_info_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_team_id uuid;
    v_event_id uuid;
    v_max_team_size smallint;
    v_member_count integer;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    if p_team_code is null or trim(p_team_code) = '' then
        raise exception 'Team code cannot be empty';
    end if;

    if not coalesce(p_member_info_consent, false) then
        raise exception 'Member information consent is required';
    end if;

    if not public.is_verified_user() then
        raise exception 'User is not verified';
    end if;

    select t.id, t.event_id, e.max_team_size
    into v_team_id, v_event_id, v_max_team_size
    from public.teams t
    join public.events e on e.id = t.event_id
    where t.team_code = upper(trim(p_team_code))
      and e.event_type = 'team';

    if v_team_id is null then
        raise exception 'Invalid team code';
    end if;

    if not exists (
        select 1
        from public.teams
        where id = v_team_id
          and status = 'forming'
    ) then
        raise exception 'Team is not accepting new members';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended(auth.uid()::text || ':' || v_event_id::text, 0)
    );
    perform pg_advisory_xact_lock(hashtextextended(v_team_id::text, 0));

    if exists (
        select 1
        from public.team_members tm
        join public.teams t on t.id = tm.team_id
        where tm.user_id = auth.uid()
          and t.event_id = v_event_id
    ) then
        raise exception 'User is already a member of a team for this event';
    end if;

    select count(*) into v_member_count
    from public.team_members
    where team_id = v_team_id;

    if v_member_count >= v_max_team_size then
        raise exception 'Team is already full';
    end if;

    insert into public.team_members (team_id, user_id, member_info_consent)
    values (v_team_id, auth.uid(), true);

    return v_team_id;
end;
$$;

revoke execute on function public.join_team(text) from public, anon, authenticated;
revoke execute on function public.join_team(text, boolean) from public, anon;
grant execute on function public.join_team(text, boolean) to authenticated;

commit;
