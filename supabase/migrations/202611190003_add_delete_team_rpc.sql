begin;

create or replace function public.delete_team(p_team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $delete_team$
declare
    v_leader_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    select t.leader_id
    into v_leader_id
    from public.teams t
    where t.id = p_team_id
    for update;

    if not found then
        return false;
    end if;

    if v_leader_id <> auth.uid() then
        raise exception 'Only the team leader can delete this team';
    end if;

    if exists (
        select 1
        from public.attendance a
        where a.team_id = p_team_id
    ) or exists (
        select 1
        from public.results r
        where r.team_id = p_team_id
    ) then
        raise exception 'A team with attendance or results cannot be deleted';
    end if;

    delete from public.teams t
    where t.id = p_team_id;

    return true;
end;
$delete_team$;

revoke all on function public.delete_team(uuid) from public, anon;
grant execute on function public.delete_team(uuid) to authenticated;

commit;
