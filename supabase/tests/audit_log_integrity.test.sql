begin;

select
    plan(13);

-- Fixtures are local to this transaction and roll back after the assertions.
insert into
    auth.users (id, email)
values
    (
        'c1000000-0000-4000-8000-000000000001',
        'audit-integrity-admin@example.invalid'
    ),
    (
        'c1000000-0000-4000-8000-000000000002',
        'audit-integrity-participant@example.invalid'
    ),
    (
        'c1000000-0000-4000-8000-000000000003',
        'audit-integrity-new-admin@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        'c1000000-0000-4000-8000-000000000001',
        'SUPER_ADMIN',
        'active'
    );

insert into
    public.audit_logs (admin_id, action, entity_type, metadata)
values
    (
        'c1000000-0000-4000-8000-000000000001',
        'FIXTURE_ACTION',
        'test',
        '{"source":"audit integrity fixture"}' :: jsonb
    );

select
    is(
        has_table_privilege('anon', 'public.audit_logs', 'INSERT'),
        false,
        'anonymous users cannot insert audit logs directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
        false,
        'authenticated users cannot insert audit logs directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE'),
        false,
        'authenticated users cannot update audit logs directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.audit_logs', 'DELETE'),
        false,
        'authenticated users cannot delete audit logs directly'
    );

select
    set_config('request.jwt.claims', '{"role":"anon"}', true);

select
    set_config('request.jwt.claim.sub', '', true);

set
    local role anon;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
        ),
        0,
        'anonymous users cannot read audit logs'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000002","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000002',
        true
    );

set
    local role authenticated;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
        ),
        0,
        'participants cannot read audit logs'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'c1000000-0000-4000-8000-000000000001',
        true
    );

set
    local role authenticated;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                action = 'FIXTURE_ACTION'
        ),
        1,
        'active admins can read audit logs'
    );

select
    throws_ok(
        'insert into public.audit_logs (admin_id, action, entity_type) values (''c1000000-0000-4000-8000-000000000001'', ''FORGED_ACTION'', ''test'')',
        '42501',
        'permission denied for table audit_logs',
        'admins cannot forge audit records through direct inserts'
    );

select
    throws_ok(
        'update public.audit_logs set action = ''ALTERED_ACTION'' where action = ''FIXTURE_ACTION''',
        '42501',
        'permission denied for table audit_logs',
        'admins cannot alter existing audit records'
    );

select
    throws_ok(
        'delete from public.audit_logs where action = ''FIXTURE_ACTION''',
        '42501',
        'permission denied for table audit_logs',
        'admins cannot delete audit records'
    );

select
    is(
        (
            select
                action || ':' || (metadata ->> 'source')
            from
                public.audit_logs
            where
                action = 'FIXTURE_ACTION'
        ),
        'FIXTURE_ACTION:audit integrity fixture',
        'blocked direct writes leave the existing record unchanged'
    );

select
    ok(
        public.create_admin('c1000000-0000-4000-8000-000000000003', 'ADMIN') is not null,
        'the trusted admin RPC can create an admin despite direct insert restrictions'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                admin_id = 'c1000000-0000-4000-8000-000000000001'
                and action = 'CREATE_ADMIN'
                and metadata ->> 'user_id' = 'c1000000-0000-4000-8000-000000000003'
        ),
        1,
        'the trusted admin RPC appends its audit record'
    );

select
    *
from
    finish();

rollback;