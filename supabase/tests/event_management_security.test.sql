begin;

select
    plan(17);

-- Local-only identities and event fixtures; rollback leaves no persistent rows.
insert into
    auth.users (id, email)
values
    (
        'a1000000-0000-4000-8000-000000000001',
        'event-security-admin@example.invalid'
    ),
    (
        'a1000000-0000-4000-8000-000000000002',
        'event-security-inactive@example.invalid'
    ),
    (
        'a1000000-0000-4000-8000-000000000003',
        'event-security-participant@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        'a1000000-0000-4000-8000-000000000001',
        'ADMIN',
        'active'
    ),
    (
        'a1000000-0000-4000-8000-000000000002',
        'ADMIN',
        'inactive'
    );

insert into
    public.events (
        id,
        name,
        slug,
        short_description,
        description,
        event_type,
        category,
        venue
    )
values
    (
        'a2000000-0000-4000-8000-000000000001',
        'Event Security Fixture',
        'event-security-fixture',
        'Fixture for local RLS tests',
        'This fixture is rolled back when the test finishes.',
        'solo',
        'Testing',
        'Local'
    );

select
    is(
        has_table_privilege('anon', 'public.events', 'SELECT'),
        true,
        'anonymous users have SELECT access to the events table'
    );

select
    is(
        has_table_privilege('authenticated', 'public.events', 'SELECT'),
        true,
        'authenticated users have SELECT access to the events table'
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
                public.events
            where
                id = 'a2000000-0000-4000-8000-000000000001'
        ),
        1,
        'anonymous visitors can read published event records'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"a1000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'a1000000-0000-4000-8000-000000000003',
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
                public.events
            where
                id = 'a2000000-0000-4000-8000-000000000001'
        ),
        1,
        'participants can read event records'
    );

select
    throws_ok(
        'insert into public.events (name, slug, short_description, description, event_type, category, venue) values (''Participant Event'', ''participant-event'', ''x'', ''x'', ''solo'', ''Testing'', ''Local'')',
        '42501',
        'new row violates row-level security policy for table "events"',
        'participants cannot create events'
    );

select
    lives_ok(
        'update public.events set name = ''Participant Changed'' where id = ''a2000000-0000-4000-8000-000000000001''',
        'participant update is safely filtered by row-level security'
    );

select
    is(
        (
            select
                name
            from
                public.events
            where
                id = 'a2000000-0000-4000-8000-000000000001'
        ),
        'Event Security Fixture',
        'participant update does not change the event'
    );

select
    lives_ok(
        'delete from public.events where id = ''a2000000-0000-4000-8000-000000000001''',
        'participant delete is safely filtered by row-level security'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.events
            where
                id = 'a2000000-0000-4000-8000-000000000001'
        ),
        1,
        'participant delete leaves the event intact'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'a1000000-0000-4000-8000-000000000002',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        'insert into public.events (name, slug, short_description, description, event_type, category, venue) values (''Inactive Event'', ''inactive-event'', ''x'', ''x'', ''solo'', ''Testing'', ''Local'')',
        '42501',
        'new row violates row-level security policy for table "events"',
        'inactive admins cannot create events'
    );

select
    lives_ok(
        'update public.events set name = ''Inactive Changed'' where id = ''a2000000-0000-4000-8000-000000000001''',
        'inactive admin update is safely filtered by row-level security'
    );

select
    is(
        (
            select
                name
            from
                public.events
            where
                id = 'a2000000-0000-4000-8000-000000000001'
        ),
        'Event Security Fixture',
        'inactive admin update does not change the event'
    );

select
    lives_ok(
        'delete from public.events where id = ''a2000000-0000-4000-8000-000000000001''',
        'inactive admin delete is safely filtered by row-level security'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.events
            where
                id = 'a2000000-0000-4000-8000-000000000001'
        ),
        1,
        'inactive admin delete leaves the event intact'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        'a1000000-0000-4000-8000-000000000001',
        true
    );

set
    local role authenticated;

select
    lives_ok(
        'insert into public.events (name, slug, short_description, description, event_type, category, venue) values (''Admin Event'', ''admin-event'', ''x'', ''x'', ''solo'', ''Testing'', ''Local'')',
        'active admins can create events'
    );

select
    lives_ok(
        'update public.events set name = ''Admin Updated'' where id = ''a2000000-0000-4000-8000-000000000001''',
        'active admins can update events'
    );

select
    lives_ok(
        'delete from public.events where id = ''a2000000-0000-4000-8000-000000000001''',
        'active admins can delete events'
    );

select
    *
from
    finish();

rollback;