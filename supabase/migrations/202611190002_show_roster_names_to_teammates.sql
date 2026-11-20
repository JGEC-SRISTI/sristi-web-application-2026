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
as $roster$
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    if not exists (
        select 1
        from public.team_members tm
        where tm.team_id = p_team_id
          and tm.user_id = auth.uid()
    ) then
        raise exception 'Only team members can view the team roster';
    end if;

    return query
    select
        p.full_name,
        t.leader_id = tm.user_id,
        tm.user_id = auth.uid()
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    join public.profiles p on p.id = tm.user_id
    where tm.team_id = p_team_id
    order by tm.joined_at, tm.id;
end;
$roster$;

revoke all on function public.get_team_roster(uuid) from public, anon;
grant execute on function public.get_team_roster(uuid) to authenticated;

commit;
