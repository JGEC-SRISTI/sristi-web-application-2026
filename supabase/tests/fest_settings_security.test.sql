begin;

select
    plan(19);

-- The singleton settings row may already exist from seed.sql. Replace it only
-- inside this transaction so rollback restores the local seed exactly.
delete from
    public.fest_settings
where
    id = 1;

insert into
    auth.users (id, email)
values
    (
        'b1000000-0000-4000-8000-000000000001',
        'settings-security-admin@example.invalid'
    ),
    (
        'b1000000-0000-4000-8000-000000000002',
        'settings-security-inactive@example.invalid'
    ),
    (
        'b1000000-0000-4000-8000-000000000003',
        'settings-security-participant@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        'b1000000-0000-4000-8000-000000000001',
        'ADMIN',
        'active'
    ),
    (
        'b1000000-0000-4000-8000-000000000002',
        'ADMIN',
        'inactive'
    );

insert into
    public.fest_settings (id, fest_name, fest_fee)
values
    (1, 'Settings Security Fixture', 250.00);

select
    is(
        has_table_privilege('anon', 'public.fest_settings', 'SELECT'),
        true,
        'anonymous users have SELECT access to fest settings'
    );

select
    is(
        has_table_privilege(
            'authenticated',
            'public.fest_settings',
            'SELECT'
        ),
        true,
        'authenticated users have SELECT access to fest settings'
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
                public.fest_settings
            where
                id = 1
        ),
        1,
        'anonymous visitors can read fest settings'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"b1000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'b1000000-0000-4000-8000-000000000003',
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
                public.fest_settings
            where
                id = 1
        ),
        1,
        'participants can read fest settings'
    );

select
    lives_ok(
        'update public.fest_settings set fest_fee = 1 where id = 1',
        'participant update is filtered by row-level security'
    );

select
    is(
        (
            select
                fest_fee
            from
                public.fest_settings
            where
                id = 1
        ),
        250.00 :: numeric,
        'participant update does not change the fee'
    );

select
    lives_ok(
        'delete from public.fest_settings where id = 1',
        'participant delete is filtered by row-level security'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.fest_settings
            where
                id = 1
        ),
        1,
        'participant delete leaves the settings row intact'
    );

reset role;

delete from
    public.fest_settings
where
    id = 1;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"b1000000-0000-4000-8000-000000000002","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'b1000000-0000-4000-8000-000000000002',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        'insert into public.fest_settings (id, fest_name, fest_fee) values (1, ''Inactive Attempt'', 999.00)',
        '42501',
        'new row violates row-level security policy for table "fest_settings"',
        'inactive admins cannot create fest settings'
    );

reset role;

insert into
    public.fest_settings (id, fest_name, fest_fee)
values
    (1, 'Settings Security Fixture', 250.00);

set
    local role authenticated;

select
    lives_ok(
        'update public.fest_settings set fest_fee = 1 where id = 1',
        'inactive admin update is filtered by row-level security'
    );

select
    is(
        (
            select
                fest_fee
            from
                public.fest_settings
            where
                id = 1
        ),
        250.00 :: numeric,
        'inactive admin update does not change the fee'
    );

select
    lives_ok(
        'delete from public.fest_settings where id = 1',
        'inactive admin delete is filtered by row-level security'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.fest_settings
            where
                id = 1
        ),
        1,
        'inactive admin delete leaves the settings row intact'
    );

reset role;

delete from
    public.fest_settings
where
    id = 1;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'b1000000-0000-4000-8000-000000000001',
        true
    );

set
    local role authenticated;

select
    lives_ok(
        'insert into public.fest_settings (id, fest_name, fest_fee) values (1, ''Admin Created Settings'', 300.00)',
        'active admins can create fest settings'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.fest_settings
            where
                id = 1
        ),
        1,
        'admin creation persisted the singleton settings row'
    );

select
    lives_ok(
        'update public.fest_settings set fest_name = ''Admin Updated Settings'', fest_fee = 400.00 where id = 1',
        'active admins can update fest settings'
    );

select
    is(
        (
            select
                fest_name || ':' || fest_fee :: text
            from
                public.fest_settings
            where
                id = 1
        ),
        'Admin Updated Settings:400.00',
        'admin update persisted the new fest settings'
    );

select
    lives_ok(
        'delete from public.fest_settings where id = 1',
        'active admins can delete fest settings'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.fest_settings
            where
                id = 1
        ),
        0,
        'admin deletion removed the settings row'
    );

select
    *
from
    finish();

rollback;