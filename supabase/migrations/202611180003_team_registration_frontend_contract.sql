begin;

create or replace function public.get_team_roster(p_team_id uuid)
returns table (
    full_name text,
    is_leader boolean,
    is_you boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    if not exists (
        select 1
        from public.team_members
        where team_id = p_team_id
          and user_id = auth.uid()
    ) then
        raise exception 'Only team members can view the team roster';
    end if;

    return query
    select
        case
            when tm.member_info_consent then p.full_name
            else null
        end,
        t.leader_id = tm.user_id,
        tm.user_id = auth.uid()
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    join public.profiles p on p.id = tm.user_id
    where tm.team_id = p_team_id
    order by tm.joined_at, tm.id;
end;
$$;

revoke all on function public.get_team_roster(uuid) from public, anon;
grant execute on function public.get_team_roster(uuid) to authenticated;

create or replace function public.finalize_team_registration(p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_event_id uuid;
    v_team_status text;
    v_leader_id uuid;
    v_event_type text;
    v_min_team_size smallint;
    v_max_team_size smallint;
    v_member_count integer;
    v_registration_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(p_team_id::text, 0));

    select
        t.event_id,
        t.status,
        t.leader_id,
        e.event_type,
        e.min_team_size,
        e.max_team_size,
        count(tm.id)::integer
    into
        v_event_id,
        v_team_status,
        v_leader_id,
        v_event_type,
        v_min_team_size,
        v_max_team_size,
        v_member_count
    from public.teams t
    join public.events e on e.id = t.event_id
    left join public.team_members tm on tm.team_id = t.id
    where t.id = p_team_id
    group by
        t.id,
        t.event_id,
        t.status,
        t.leader_id,
        e.event_type,
        e.min_team_size,
        e.max_team_size;

    if v_event_id is null or v_event_type <> 'team' then
        raise exception 'Invalid team event';
    end if;

    if v_leader_id <> auth.uid() then
        raise exception 'Only the team leader can finalize registration';
    end if;

    if not public.is_verified_user() then
        raise exception 'User is not verified';
    end if;

    if v_team_status = 'cancelled' then
        raise exception 'Team is not accepting registration';
    end if;

    if v_member_count < v_min_team_size
       or v_member_count > v_max_team_size then
        raise exception 'Team does not meet the event size requirements';
    end if;

    select id
    into v_registration_id
    from public.registrations
    where team_id = p_team_id
      and status = 'registered'
    order by registered_at
    limit 1;

    if v_registration_id is not null then
        return v_registration_id;
    end if;

    update public.teams
    set status = 'registered',
        updated_at = now()
    where id = p_team_id
      and status = 'forming';

    insert into public.registrations (event_id, team_id, status)
    values (v_event_id, p_team_id, 'registered')
    on conflict do nothing
    returning id into v_registration_id;

    if v_registration_id is null then
        select id
        into v_registration_id
        from public.registrations
        where team_id = p_team_id
          and status = 'registered'
        order by registered_at
        limit 1;
    end if;

    if v_registration_id is null then
        raise exception 'Team registration could not be completed';
    end if;

    return v_registration_id;
end;
$$;

revoke all on function public.finalize_team_registration(uuid) from public, anon;
grant execute on function public.finalize_team_registration(uuid) to authenticated;

drop policy if exists "Team leaders can view own team registrations"
    on public.registrations;

create policy "Team members can view own team registrations"
on public.registrations for select
to authenticated
using (
    team_id is not null
    and exists (
        select 1
        from public.team_members tm
        where tm.team_id = registrations.team_id
          and tm.user_id = auth.uid()
    )
);

commit;
