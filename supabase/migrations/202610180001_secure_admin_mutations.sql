-- Route admin account changes through audited RPCs.
-- The admin_users RLS policies alone are insufficient because they permit
-- super admins to write directly without creating audit log entries.
revoke
insert
,
update
,
    delete on table public.admin_users
from
    anon;

revoke
insert
,
update
,
    delete on table public.admin_users
from
    authenticated;

revoke
insert
,
update
,
    delete on table public.admin_users
from
    public;

drop policy if exists "Super admins can create admin users" on public.admin_users;

drop policy if exists "Super admins can update admin users" on public.admin_users;

drop policy if exists "Super admins can delete admin users" on public.admin_users;

-- Admin history is retained in audit_logs, whose admin_id foreign key uses
-- ON DELETE RESTRICT. Remove the unaudited hard-delete RPC and provide an
-- audited deactivation operation instead.
revoke execute on function public.delete_admin(uuid)
from
    anon;

revoke execute on function public.delete_admin(uuid)
from
    authenticated;

revoke execute on function public.delete_admin(uuid)
from
    public;

drop function public.delete_admin(uuid);

create
or replace function public.deactivate_admin(p_admin_id uuid) returns boolean language plpgsql security definer
set
    search_path = public as $deactivate_admin$ begin if not public.is_super_admin() then raise exception 'Only super admins can deactivate admins';

end if;

if not exists (
    select
        1
    from
        public.admin_users
    where
        id = p_admin_id
) then raise exception 'Admin not found';

end if;

if exists (
    select
        1
    from
        public.admin_users
    where
        id = p_admin_id
        and user_id = auth.uid()
) then raise exception 'You cannot deactivate your own admin account';

end if;

update
    public.admin_users
set
    status = 'inactive',
    updated_at = now()
where
    id = p_admin_id;

insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
select
    auth.uid(),
    'DEACTIVATE_ADMIN',
    'admin',
    p_admin_id,
    jsonb_build_object('deactivated_user_id', user_id)
from
    public.admin_users
where
    id = p_admin_id;

return true;

end;

$deactivate_admin$;

revoke execute on function public.deactivate_admin(uuid)
from
    anon;

revoke execute on function public.deactivate_admin(uuid)
from
    public;

grant execute on function public.deactivate_admin(uuid) to authenticated;
