begin;

select
    plan(37);

-- All fixtures are local to this transaction and are rolled back at the end.
insert into
    auth.users (id, email)
values
    (
        '71000000-0000-4000-8000-000000000001',
        'results-admin@example.invalid'
    ),
    (
        '71000000-0000-4000-8000-000000000002',
        'results-inactive-admin@example.invalid'
    ),
    (
        '71000000-0000-4000-8000-000000000003',
        'results-participant@example.invalid'
    ),
    (
        '71000000-0000-4000-8000-000000000004',
        'results-unregistered@example.invalid'
    ),
    (
        '71000000-0000-4000-8000-000000000005',
        'results-second-registered@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        '71000000-0000-4000-8000-000000000001',
        'ADMIN',
        'active'
    ),
    (
        '71000000-0000-4000-8000-000000000002',
        'ADMIN',
        'inactive'
    );

insert into
    public.profiles (
        id,
        full_name,
        phone,
        college_name,
        college_roll,
        department,
        academic_year
    )
values
    (
        '71000000-0000-4000-8000-000000000003',
        'Results Participant',
        '9400000003',
        'JGEC',
        'RS003',
        'CSE',
        3
    ),
    (
        '71000000-0000-4000-8000-000000000004',
        'Results Unregistered',
        '9400000004',
        'JGEC',
        'RS004',
        'ECE',
        2
    ),
    (
        '71000000-0000-4000-8000-000000000005',
        'Results Second Participant',
        '9400000005',
        'JGEC',
        'RS005',
        'EEE',
        1
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
        venue,
        min_team_size,
        max_team_size
    )
values
    (
        '72000000-0000-4000-8000-000000000001',
        'Results solo event',
        'results-solo-test',
        'Local solo event',
        'Local test fixture; rolled back with this test.',
        'solo',
        'Test',
        'Local',
        null,
        null
    ),
    (
        '72000000-0000-4000-8000-000000000002',
        'Results team event',
        'results-team-test',
        'Local team event',
        'Local test fixture; rolled back with this test.',
        'team',
        'Test',
        'Local',
        3,
        5
    ),
    (
        '72000000-0000-4000-8000-000000000003',
        'Other results team event',
        'results-other-team-test',
        'Second local team event',
        'Local test fixture; rolled back with this test.',
        'team',
        'Test',
        'Local',
        3,
        5
    );

insert into
    public.teams (
        id,
        event_id,
        team_name,
        team_code,
        leader_id
    )
values
    (
        '73000000-0000-4000-8000-000000000001',
        '72000000-0000-4000-8000-000000000002',
        'Results Registered Team',
        'RESULTS-REGISTERED-TEAM',
        '71000000-0000-4000-8000-000000000003'
    ),
    (
        '73000000-0000-4000-8000-000000000002',
        '72000000-0000-4000-8000-000000000003',
        'Results Other Event Team',
        'RESULTS-OTHER-TEAM',
        '71000000-0000-4000-8000-000000000003'
    ),
    (
        '73000000-0000-4000-8000-000000000003',
        '72000000-0000-4000-8000-000000000002',
        'Results Unregistered Team',
        'RESULTS-UNREGISTERED-TEAM',
        '71000000-0000-4000-8000-000000000003'
    );

insert into
    public.registrations (event_id, user_id, status)
values
    (
        '72000000-0000-4000-8000-000000000001',
        '71000000-0000-4000-8000-000000000003',
        'registered'
    ),
    (
        '72000000-0000-4000-8000-000000000001',
        '71000000-0000-4000-8000-000000000004',
        'cancelled'
    ),
    (
        '72000000-0000-4000-8000-000000000001',
        '71000000-0000-4000-8000-000000000004',
        'registered'
    );

insert into
    public.registrations (event_id, team_id, status)
values
    (
        '72000000-0000-4000-8000-000000000002',
        '73000000-0000-4000-8000-000000000001',
        'registered'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.declare_result(uuid,uuid,uuid,smallint)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot call declare_result'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.declare_result(uuid,uuid,uuid,smallint)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded result function'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.set_leaderboard_visibility(boolean)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot change leaderboard visibility'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.set_leaderboard_visibility(boolean)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded visibility function'
    );

select
    is(
        has_table_privilege('authenticated', 'public.results', 'INSERT'),
        false,
        'authenticated users cannot insert results directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.results', 'UPDATE'),
        false,
        'authenticated users cannot update results directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.results', 'DELETE'),
        false,
        'authenticated users cannot delete results directly'
    );

select
    is(
        has_table_privilege(
            'anon',
            'public.individual_leaderboard',
            'SELECT'
        ),
        false,
        'anonymous users cannot query the unfiltered leaderboard view'
    );

select
    set_config(
        'request.jwt.claims',
        '{"sub":"71000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '71000000-0000-4000-8000-000000000003',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', null, 1::smallint)',
        'P0001',
        'Only admins can declare results',
        'a participant cannot declare results'
    );

select
    throws_ok(
        'select public.set_leaderboard_visibility(true)',
        'P0001',
        'Only admins can change leaderboard visibility',
        'a participant cannot publish the leaderboard'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '71000000-0000-4000-8000-000000000002',
        true
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', null, 1::smallint)',
        'P0001',
        'Only admins can declare results',
        'an inactive admin cannot declare results'
    );

select
    throws_ok(
        'select public.set_leaderboard_visibility(true)',
        'P0001',
        'Only admins can change leaderboard visibility',
        'an inactive admin cannot publish the leaderboard'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '71000000-0000-4000-8000-000000000001',
        true
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', null, 0::smallint)',
        'P0001',
        'Position must be between 1 and 3',
        'a result position cannot be below first place'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', null, 4::smallint)',
        'P0001',
        'Position must be between 1 and 3',
        'a result position cannot exceed third place'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', null, null::smallint)',
        'P0001',
        'Position must be between 1 and 3',
        'a result position is required'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', null, null, 1::smallint)',
        'P0001',
        'Specify either a user or a team, not both',
        'a result must specify one target'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', ''73000000-0000-4000-8000-000000000001'', 1::smallint)',
        'P0001',
        'Specify either a user or a team, not both',
        'a result cannot specify both an individual and a team'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000099'', ''71000000-0000-4000-8000-000000000003'', null, 1::smallint)',
        'P0001',
        'Event not found',
        'a result cannot be declared for a nonexistent event'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', null, ''73000000-0000-4000-8000-000000000001'', 1::smallint)',
        'P0001',
        'Solo events require an individual result',
        'a solo event cannot use a team result target'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000002'', ''71000000-0000-4000-8000-000000000003'', null, 1::smallint)',
        'P0001',
        'Team events require a team result',
        'a team event cannot use an individual result target'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000005'', null, 1::smallint)',
        'P0001',
        'Participant is not registered for this event',
        'a participant without an active registration cannot receive a result'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000002'', null, ''73000000-0000-4000-8000-000000000002'', 1::smallint)',
        'P0001',
        'Team does not belong to this event',
        'a team from another event cannot receive a result'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000002'', null, ''73000000-0000-4000-8000-000000000003'', 1::smallint)',
        'P0001',
        'Team is not registered for this event',
        'a team without an active registration cannot receive a result'
    );

select
    set_config(
        'test.solo_result_id',
        public.declare_result(
            '72000000-0000-4000-8000-000000000001',
            '71000000-0000-4000-8000-000000000003',
            null,
            1::smallint
        ) :: text,
        true
    );

select
    ok(
        exists (
            select
                1
            from
                public.results
            where
                id = current_setting('test.solo_result_id') :: uuid
                and event_id = '72000000-0000-4000-8000-000000000001'
                and user_id = '71000000-0000-4000-8000-000000000003'
                and team_id is null
                and position = 1
                and declared_by = '71000000-0000-4000-8000-000000000001'
        ),
        'an active admin can declare first place for a registered solo participant'
    );

select
    ok(
        exists (
            select
                1
            from
                public.audit_logs
            where
                admin_id = '71000000-0000-4000-8000-000000000001'
                and action = 'DECLARE_RESULT'
                and entity_type = 'result'
                and entity_id = current_setting('test.solo_result_id') :: uuid
        ),
        'declaring a result writes an audit record'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000004'', null, 1::smallint)',
        '23505',
        null,
        'an event cannot award the same position twice'
    );

select
    throws_ok(
        'select public.declare_result(''72000000-0000-4000-8000-000000000001'', ''71000000-0000-4000-8000-000000000003'', null, 2::smallint)',
        '23505',
        null,
        'a participant cannot receive multiple positions in one event'
    );

select
    set_config(
        'test.team_result_id',
        public.declare_result(
            '72000000-0000-4000-8000-000000000002',
            null,
            '73000000-0000-4000-8000-000000000001',
            1::smallint
        ) :: text,
        true
    );

select
    ok(
        exists (
            select
                1
            from
                public.results
            where
                id = current_setting('test.team_result_id') :: uuid
                and event_id = '72000000-0000-4000-8000-000000000002'
                and user_id is null
                and team_id = '73000000-0000-4000-8000-000000000001'
                and position = 1
                and declared_by = '71000000-0000-4000-8000-000000000001'
        ),
        'an active admin can declare first place for a registered team'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.public_leaderboard
        ),
        0,
        'the public leaderboard is empty before publication'
    );

reset role;

select
    set_config(
        'request.jwt.claim.sub',
        '71000000-0000-4000-8000-000000000001',
        true
    );

set
    local role authenticated;

select
    is(
        public.set_leaderboard_visibility(true),
        true,
        'an active admin can publish the leaderboard'
    );

select
    ok(
        exists (
            select
                1
            from
                public.leaderboard_settings
            where
                id = 1
                and is_public
                and published_at is not null
                and updated_by = '71000000-0000-4000-8000-000000000001'
        ),
        'publishing records visibility, publication time, and admin'
    );

select
    ok(
        exists (
            select
                1
            from
                public.audit_logs
            where
                admin_id = '71000000-0000-4000-8000-000000000001'
                and action = 'PUBLISH_LEADERBOARD'
                and entity_type = 'leaderboard'
        ),
        'publishing the leaderboard writes an audit record'
    );

reset role;

set
    local role anon;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.public_leaderboard
        ),
        1,
        'anonymous visitors can read the published leaderboard'
    );

reset role;

set
    local role authenticated;

select
    is(
        public.set_leaderboard_visibility(false),
        true,
        'an active admin can unpublish the leaderboard'
    );

select
    ok(
        exists (
            select
                1
            from
                public.leaderboard_settings
            where
                id = 1
                and not is_public
                and published_at is null
        ),
        'unpublishing hides the flag and clears publication time'
    );

reset role;

set
    local role anon;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.public_leaderboard
        ),
        0,
        'anonymous visitors cannot see leaderboard rows after unpublishing'
    );

reset role;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                admin_id = '71000000-0000-4000-8000-000000000001'
                and action in (
                    'PUBLISH_LEADERBOARD',
                    'UNPUBLISH_LEADERBOARD'
                )
                and entity_type = 'leaderboard'
        ),
        2,
        'publishing and unpublishing both write audit records'
    );

select
    *
from
    finish();

rollback;
