-- Team events may require one exact member count or accept a bounded range.
alter table public.events
drop constraint if exists events_team_size_rules_check;

alter table public.events
add constraint events_team_size_rules_check check (
    (
        event_type = 'solo'
        and min_team_size is null
        and max_team_size is null
    )
    or (
        event_type = 'team'
        and min_team_size between 1 and 5
        and max_team_size between 1 and 5
        and min_team_size <= max_team_size
    )
) not valid;

create or replace function public.is_team_size_valid(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
select exists (
    select 1
    from public.teams t
    join public.events e on e.id = t.event_id
    where t.id = p_team_id
      and e.event_type = 'team'
      and (
          select count(*)
          from public.team_members tm
          where tm.team_id = t.id
      ) between e.min_team_size and e.max_team_size
);
$$;

create or replace function public.join_team(p_team_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_team_id uuid;
    v_member_count integer;
    v_max_team_size smallint;
begin
    if not public.is_verified_user() then
        raise exception 'User is not verified';
    end if;

    if trim(p_team_code) = '' then
        raise exception 'Team code cannot be empty';
    end if;

    select t.id, e.max_team_size
    into v_team_id, v_max_team_size
    from public.teams t
    join public.events e on e.id = t.event_id
    where t.team_code = trim(p_team_code)
      and t.status = 'forming'
      and e.event_type = 'team';

    if v_team_id is null then
        raise exception 'Invalid or unavailable team code';
    end if;

    if exists (
        select 1
        from public.team_members
        where team_id = v_team_id
          and user_id = auth.uid()
    ) then
        raise exception 'User is already a member of this team';
    end if;

    select count(*)
    into v_member_count
    from public.team_members
    where team_id = v_team_id;

    if v_member_count >= v_max_team_size then
        raise exception 'Team is already full';
    end if;

    insert into public.team_members (team_id, user_id)
    values (v_team_id, auth.uid());

    return v_team_id;
end;
$$;

revoke execute on function public.is_team_size_valid(uuid) from anon;
grant execute on function public.is_team_size_valid(uuid) to authenticated;

revoke execute on function public.join_team(text) from anon, public;
grant execute on function public.join_team(text) to authenticated;
