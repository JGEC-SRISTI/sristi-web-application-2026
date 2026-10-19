begin;

select
    plan(16);

-- These six local-only identities all have completed verification. Every
-- fixture is rolled back at the end of the test.
insert into
    auth.users (id, email)
values
    (
        '11000000-0000-4000-8000-000000000001',
        'team-test-1@example.invalid'
    ),
    (
        '11000000-0000-4000-8000-000000000002',
        'team-test-2@example.invalid'
    ),
    (
        '11000000-0000-4000-8000-000000000003',
        'team-test-3@example.invalid'
    ),
    (
        '11000000-0000-4000-8000-000000000004',
        'team-test-4@example.invalid'
    ),
    (
        '11000000-0000-4000-8000-000000000005',
        'team-test-5@example.invalid'
    ),
    (
        '11000000-0000-4000-8000-000000000006',
        'team-test-6@example.invalid'
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
        '11000000-0000-4000-8000-000000000001',
        'Team Test 1',
        '9100000001',
        'JGEC',
        'T001',
        'CSE',
        3
    ),
    (
        '11000000-0000-4000-8000-000000000002',
        'Team Test 2',
        '9100000002',
        'JGEC',
        'T002',
        'CSE',
        3
    ),
    (
        '11000000-0000-4000-8000-000000000003',
        'Team Test 3',
        '9100000003',
        'JGEC',
        'T003',
        'CSE',
        3
    ),
    (
        '11000000-0000-4000-8000-000000000004',
        'Team Test 4',
        '9100000004',
        'JGEC',
        'T004',
        'CSE',
        3
    ),
    (
        '11000000-0000-4000-8000-000000000005',
        'Team Test 5',
        '9100000005',
        'JGEC',
        'T005',
        'CSE',
        3
    ),
    (
        '11000000-0000-4000-8000-000000000006',
        'Team Test 6',
        '9100000006',
        'JGEC',
        'T006',
        'CSE',
        3
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
        '21000000-0000-4000-8000-000000000001',
        'Team membership security test',
        'team-membership-security-test',
        'Local team event',
        'Local test fixture; rolled back with this test.',
        'team',
        'Test',
        'Local'
    );

insert into
    public.payment_records (id, user_id, amount, payment_method, status)
values
    (
        '31000000-0000-4000-8000-000000000001',
        '11000000-0000-4000-8000-000000000001',
        100,
        'offline',
        'verified'
    ),
    (
        '31000000-0000-4000-8000-000000000002',
        '11000000-0000-4000-8000-000000000002',
        100,
        'offline',
        'verified'
    ),
    (
        '31000000-0000-4000-8000-000000000003',
        '11000000-0000-4000-8000-000000000003',
        100,
        'offline',
        'verified'
    ),
    (
        '31000000-0000-4000-8000-000000000004',
        '11000000-0000-4000-8000-000000000004',
        100,
        'offline',
        'verified'
    ),
    (
        '31000000-0000-4000-8000-000000000005',
        '11000000-0000-4000-8000-000000000005',
        100,
        'offline',
        'verified'
    ),
    (
        '31000000-0000-4000-8000-000000000006',
        '11000000-0000-4000-8000-000000000006',
        100,
        'offline',
        'verified'
    );

insert into
    public.verification_codes (id, code, user_id, payment_id, status)
values
    (
        '41000000-0000-4000-8000-000000000001',
        'TEAM-TEST-1',
        '11000000-0000-4000-8000-000000000001',
        '31000000-0000-4000-8000-000000000001',
        'used'
    ),
    (
        '41000000-0000-4000-8000-000000000002',
        'TEAM-TEST-2',
        '11000000-0000-4000-8000-000000000002',
        '31000000-0000-4000-8000-000000000002',
        'used'
    ),
    (
        '41000000-0000-4000-8000-000000000003',
        'TEAM-TEST-3',
        '11000000-0000-4000-8000-000000000003',
        '31000000-0000-4000-8000-000000000003',
        'used'
    ),
    (
        '41000000-0000-4000-8000-000000000004',
        'TEAM-TEST-4',
        '11000000-0000-4000-8000-000000000004',
        '31000000-0000-4000-8000-000000000004',
        'used'
    ),
    (
        '41000000-0000-4000-8000-000000000005',
        'TEAM-TEST-5',
        '11000000-0000-4000-8000-000000000005',
        '31000000-0000-4000-8000-000000000005',
        'used'
    ),
    (
        '41000000-0000-4000-8000-000000000006',
        'TEAM-TEST-6',
        '11000000-0000-4000-8000-000000000006',
        '31000000-0000-4000-8000-000000000006',
        'used'
    );

select
    set_config(
        'request.jwt.claims',
        '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000001',
        true
    );

set
    local role authenticated;

select
    set_config(
        'test.team_id',
        public.create_team(
            '21000000-0000-4000-8000-000000000001',
            'Test Team'
        ) :: text,
        true
    );

reset role;

select
    set_config(
        'test.team_code',
        (
            select
                team_code
            from
                public.teams
            where
                id = current_setting('test.team_id') :: uuid
        ),
        true
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.team_members
            where
                team_id = current_setting('test.team_id') :: uuid
        ),
        1,
        'team creation adds its leader as the first member'
    );

set
    local role authenticated;

select
    throws_ok(
        'select public.register_team(current_setting(''test.team_id'')::uuid)',
        'P0001',
        'Team cannot be registered',
        'a team with fewer than three members cannot be confirmed'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000002',
        true
    );

select
    is(
        public.join_team(current_setting('test.team_code')),
        current_setting('test.team_id') :: uuid,
        'a verified participant can join a forming team'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000001',
        true
    );

select
    throws_ok(
        'select public.register_team(current_setting(''test.team_id'')::uuid)',
        'P0001',
        'Team cannot be registered',
        'a team with two members still cannot be confirmed'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000003',
        true
    );

select
    is(
        public.join_team(current_setting('test.team_code')),
        current_setting('test.team_id') :: uuid,
        'a third verified participant can join the team'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000004',
        true
    );

select
    is(
        public.join_team(current_setting('test.team_code')),
        current_setting('test.team_id') :: uuid,
        'a fourth verified participant can join the team'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000005',
        true
    );

select
    is(
        public.join_team(current_setting('test.team_code')),
        current_setting('test.team_id') :: uuid,
        'a fifth verified participant can join the team'
    );

reset role;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.team_members
            where
                team_id = current_setting('test.team_id') :: uuid
        ),
        5,
        'the team can contain at most five members'
    );

set
    local role authenticated;

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000006',
        true
    );

select
    throws_ok(
        'select public.join_team(current_setting(''test.team_code''))',
        'P0001',
        'Team is already full',
        'a sixth participant cannot join a full team'
    );

select
    set_config(
        'test.second_team_id',
        public.create_team(
            '21000000-0000-4000-8000-000000000001',
            'Second Team'
        ) :: text,
        true
    );

reset role;

select
    set_config(
        'test.second_team_code',
        (
            select
                team_code
            from
                public.teams
            where
                id = current_setting('test.second_team_id') :: uuid
        ),
        true
    );

set
    local role authenticated;

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000002',
        true
    );

select
    throws_ok(
        'select public.join_team(current_setting(''test.second_team_code''))',
        'P0001',
        'User is already a member of a team for this event',
        'a participant cannot join a second team for the same event'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000001',
        true
    );

select
    is(
        public.register_team(current_setting('test.team_id') :: uuid),
        true,
        'the leader can confirm a team once it has at least three members'
    );

reset role;

select
    is(
        (
            select
                status
            from
                public.teams
            where
                id = current_setting('test.team_id') :: uuid
        ),
        'registered',
        'team confirmation changes its status to registered'
    );

set
    local role authenticated;

select
    ok(
        public.register_team_event(current_setting('test.team_id') :: uuid) is not null,
        'the leader can register the confirmed team for its team event'
    );

select
    throws_ok(
        'select public.register_team_event(current_setting(''test.team_id'')::uuid)',
        'P0001',
        'Team is already registered for this event',
        'a team cannot register for the same event twice'
    );

reset role;

select
    is(
        (
            select
                count(*) :: integer
            from
                public.registrations
            where
                team_id = current_setting('test.team_id') :: uuid
                and status = 'registered'
        ),
        1,
        'team registration is persisted exactly once'
    );

set
    local role authenticated;

select
    set_config(
        'request.jwt.claim.sub',
        '11000000-0000-4000-8000-000000000006',
        true
    );

select
    throws_ok(
        'select public.join_team(current_setting(''test.team_code''))',
        'P0001',
        'Team is not accepting new members',
        'a registered team no longer accepts new members'
    );

select
    *
from
    finish();

rollback;
