begin;

select
    plan(30);

-- All identities and changes are local fixtures rolled back at the end.
insert into
    auth.users (id, email)
values
    (
        '91000000-0000-4000-8000-000000000001',
        'admin-security-super@example.invalid'
    ),
    (
        '91000000-0000-4000-8000-000000000002',
        'admin-security-regular@example.invalid'
    ),
    (
        '91000000-0000-4000-8000-000000000003',
        'admin-security-inactive-super@example.invalid'
    ),
    (
        '91000000-0000-4000-8000-000000000004',
        'admin-security-target@example.invalid'
    ),
    (
        '91000000-0000-4000-8000-000000000005',
        'admin-security-new@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        '91000000-0000-4000-8000-000000000001',
        'SUPER_ADMIN',
        'active'
    ),
    (
        '91000000-0000-4000-8000-000000000002',
        'ADMIN',
        'active'
    ),
    (
        '91000000-0000-4000-8000-000000000003',
        'SUPER_ADMIN',
        'inactive'
    ),
    (
        '91000000-0000-4000-8000-000000000004',
        'ADMIN',
        'active'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.create_admin(uuid,text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute create_admin'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.update_admin(uuid,text,text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute update_admin'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.deactivate_admin(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute deactivate_admin'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.create_admin(uuid,text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded create_admin RPC'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.update_admin(uuid,text,text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded update_admin RPC'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.deactivate_admin(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded deactivate_admin RPC'
    );

select
    is(
        has_table_privilege('authenticated', 'public.admin_users', 'INSERT'),
        false,
        'authenticated users cannot insert admin rows directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.admin_users', 'UPDATE'),
        false,
        'authenticated users cannot update admin rows directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.admin_users', 'DELETE'),
        false,
        'authenticated users cannot delete admin rows directly'
    );

select
    is(
        to_regprocedure('public.delete_admin(uuid)') is null,
        true,
        'the unaudited hard-delete RPC has been removed'
    );

select
    set_config(
        'request.jwt.claims',
        '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '91000000-0000-4000-8000-000000000002',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        $admin_stmt$
        select
            public.create_admin('91000000-0000-4000-8000-000000000005', 'ADMIN') $admin_stmt$,
            'P0001',
            'Only super admins can create admins',
            'a regular admin cannot create another admin'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '91000000-0000-4000-8000-000000000003',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        $admin_stmt$
        select
            public.create_admin('91000000-0000-4000-8000-000000000005', 'ADMIN') $admin_stmt$,
            'P0001',
            'Only super admins can create admins',
            'an inactive super admin cannot create another admin'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '91000000-0000-4000-8000-000000000001',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        $admin_stmt$
        select
            public.create_admin('91000000-0000-4000-8000-000000000005', 'OWNER') $admin_stmt$,
            'P0001',
            'Invalid admin role',
            'create_admin rejects roles outside the supported set'
    );

select
    throws_ok(
        $admin_stmt$
        select
            public.create_admin('91000000-0000-4000-8000-000000000099', 'ADMIN') $admin_stmt$,
            'P0001',
            'User does not exist',
            'create_admin rejects user IDs absent from auth.users'
    );

select
    ok(
        public.create_admin('91000000-0000-4000-8000-000000000005', 'ADMIN') is not null,
        'a super admin can create an admin'
    );

select
    is(
        (
            select
                role || ':' || status || ':' || created_by :: text
            from
                public.admin_users
            where
                user_id = '91000000-0000-4000-8000-000000000005'
        ),
        'ADMIN:active:91000000-0000-4000-8000-000000000001',
        'the created admin is active and records its creator'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                admin_id = '91000000-0000-4000-8000-000000000001'
                and action = 'CREATE_ADMIN'
                and entity_type = 'admin'
                and metadata ->> 'user_id' = '91000000-0000-4000-8000-000000000005'
        ),
        1,
        'admin creation writes an audit record'
    );

select
    throws_ok(
        $admin_stmt$
        select
            public.create_admin('91000000-0000-4000-8000-000000000005', 'ADMIN') $admin_stmt$,
            'P0001',
            'User is already an admin',
            'create_admin rejects duplicate admin membership'
    );

reset role;
select set_config(
    'request.jwt.claims',
    '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',
    true
);
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select
    throws_ok(
        $admin_stmt$
        select
            public.update_admin(
                (select id from public.admin_users where user_id = '91000000-0000-4000-8000-000000000004'),
                'SUPER_ADMIN',
                'active'
            ) $admin_stmt$,
            'P0001',
            'Only super admins can update admins',
            'a regular admin cannot change admin roles or status'
    );

reset role;
select set_config(
    'request.jwt.claims',
    '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
);
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select
    throws_ok(
        $admin_stmt$
        select
            public.update_admin(
                (select id from public.admin_users where user_id = '91000000-0000-4000-8000-000000000004'),
                'OWNER',
                'active'
            ) $admin_stmt$,
            'P0001',
            'Invalid admin role',
            'update_admin rejects unsupported roles'
    );

select
    throws_ok(
        $admin_stmt$
        select
            public.update_admin(
                (select id from public.admin_users where user_id = '91000000-0000-4000-8000-000000000004'),
                'ADMIN',
                'pending'
            ) $admin_stmt$,
            'P0001',
            'Invalid admin status',
            'update_admin rejects unsupported statuses'
    );

select
    throws_ok(
        $admin_stmt$
        select
            public.update_admin(
                '91000000-0000-4000-8000-000000000099',
                'ADMIN',
                'active'
            ) $admin_stmt$,
            'P0001',
            'Admin not found',
            'update_admin rejects an unknown admin ID'
    );

select
    ok(
        public.update_admin(
            (select id from public.admin_users where user_id = '91000000-0000-4000-8000-000000000004'),
            'SUPER_ADMIN',
            'active'
        ),
        'a super admin can update an admin'
    );

select
    is(
        (
            select
                role || ':' || status
            from
                public.admin_users
            where
                user_id = '91000000-0000-4000-8000-000000000004'
        ),
        'SUPER_ADMIN:active',
        'the requested role and status are persisted'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                admin_id = '91000000-0000-4000-8000-000000000001'
                and action = 'UPDATE_ADMIN'
                and entity_id = (
                    select
                        id
                    from
                        public.admin_users
                    where
                        user_id = '91000000-0000-4000-8000-000000000004'
                )
                and metadata ->> 'role' = 'SUPER_ADMIN'
                and metadata ->> 'status' = 'active'
        ),
        1,
        'admin updates write an audit record with the new values'
    );

select
    throws_ok(
        $admin_stmt$
        select
            public.deactivate_admin(
                (select id from public.admin_users where user_id = '91000000-0000-4000-8000-000000000001')
            ) $admin_stmt$,
            'P0001',
            'You cannot deactivate your own admin account',
            'a super admin cannot deactivate their own account'
    );

select
    throws_ok(
        $admin_stmt$
        select
            public.deactivate_admin('91000000-0000-4000-8000-000000000099') $admin_stmt$,
            'P0001',
            'Admin not found',
            'deactivate_admin rejects an unknown admin ID'
    );

select
    ok(
        public.deactivate_admin(
            (
                select
                    id
                from
                    public.admin_users
                where
                    user_id = '91000000-0000-4000-8000-000000000004'
            )
        ),
        'a super admin can deactivate another admin'
    );

select
    is(
        (
            select
                status
            from
                public.admin_users
            where
                user_id = '91000000-0000-4000-8000-000000000004'
        ),
        'inactive',
        'deactivation changes the target status to inactive'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                admin_id = '91000000-0000-4000-8000-000000000001'
                and action = 'DEACTIVATE_ADMIN'
                and entity_type = 'admin'
                and entity_id = (
                    select
                        id
                    from
                        public.admin_users
                    where
                        user_id = '91000000-0000-4000-8000-000000000004'
                )
                and metadata ->> 'deactivated_user_id' = '91000000-0000-4000-8000-000000000004'
        ),
        1,
        'admin deactivation writes an audit record'
    );

select
    *
from
    finish();

rollback;
