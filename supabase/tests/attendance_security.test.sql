begin;

select
    plan(23);

-- Local-only fixtures. The surrounding transaction rolls them back.
insert into
    auth.users (id, email)
values
    (
        '61000000-0000-4000-8000-000000000001',
        'attendance-admin@example.invalid'
    ),
    (
        '61000000-0000-4000-8000-000000000002',
        'attendance-inactive-admin@example.invalid'
    ),
    (
        '61000000-0000-4000-8000-000000000003',
        'attendance-participant@example.invalid'
    ),
    (
        '61000000-0000-4000-8000-000000000004',
        'attendance-unregistered@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        '61000000-0000-4000-8000-000000000001',
        'ADMIN',
        'active'
    ),
    (
        '61000000-0000-4000-8000-000000000002',
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
        '61000000-0000-4000-8000-000000000003',
        'Attendance Participant',
        '9300000003',
        'JGEC',
        'AT003',
        'CSE',
        3
    ),
    (
        '61000000-0000-4000-8000-000000000004',
        'Attendance Unregistered',
        '9300000004',
        'JGEC',
        'AT004',
        'ECE',
        2
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
        '62000000-0000-4000-8000-000000000001',
        'Attendance solo event',
        'attendance-solo-test',
        'Local solo event',
        'Local test fixture; rolled back with this test.',
        'solo',
        'Test',
        'Local',
        null,
        null
    ),
    (
        '62000000-0000-4000-8000-000000000002',
        'Attendance team event',
        'attendance-team-test',
        'Local team event',
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
        '63000000-0000-4000-8000-000000000001',
        '62000000-0000-4000-8000-000000000002',
        'Attendance Team',
        'ATTENDANCE-TEAM',
        '61000000-0000-4000-8000-000000000003'
    ),
    (
        '63000000-0000-4000-8000-000000000002',
        '62000000-0000-4000-8000-000000000001',
        'Wrong Event Team',
        'ATTENDANCE-WRONG-EVENT',
        '61000000-0000-4000-8000-000000000003'
    );

insert into
    public.registrations (event_id, user_id, status)
values
    (
        '62000000-0000-4000-8000-000000000001',
        '61000000-0000-4000-8000-000000000003',
        'registered'
    ),
    (
        '62000000-0000-4000-8000-000000000001',
        '61000000-0000-4000-8000-000000000004',
        'cancelled'
    );

insert into
    public.registrations (event_id, team_id, status)
values
    (
        '62000000-0000-4000-8000-000000000002',
        '63000000-0000-4000-8000-000000000001',
        'registered'
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
        '63000000-0000-4000-8000-000000000003',
        '62000000-0000-4000-8000-000000000002',
        'Unregistered Attendance Team',
        'ATTENDANCE-UNREGISTERED',
        '61000000-0000-4000-8000-000000000003'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.mark_attendance(uuid,uuid,uuid,text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot call mark_attendance'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.mark_attendance(uuid,uuid,uuid,text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded attendance function'
    );

select
    is(
        has_table_privilege('authenticated', 'public.attendance', 'INSERT'),
        false,
        'authenticated users cannot insert attendance directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.attendance', 'UPDATE'),
        false,
        'authenticated users cannot update attendance directly'
    );

select
    is(
        has_table_privilege('authenticated', 'public.attendance', 'DELETE'),
        false,
        'authenticated users cannot delete attendance directly'
    );

select
    set_config(
        'request.jwt.claims',
        '{"sub":"61000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '61000000-0000-4000-8000-000000000003',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', ''61000000-0000-4000-8000-000000000003'', null, ''present'')',
        'P0001',
        'Only admins can mark attendance',
        'a participant cannot mark attendance'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '61000000-0000-4000-8000-000000000002',
        true
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', ''61000000-0000-4000-8000-000000000003'', null, ''present'')',
        'P0001',
        'Only admins can mark attendance',
        'an inactive admin cannot mark attendance'
    );

select
    set_config('request.jwt.claim.sub', '', true);

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', ''61000000-0000-4000-8000-000000000003'', null, ''present'')',
        'P0001',
        'Only admins can mark attendance',
        'a session without a user ID cannot mark attendance'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '61000000-0000-4000-8000-000000000001',
        true
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', ''61000000-0000-4000-8000-000000000003'', null, ''late'')',
        'P0001',
        'Attendance status must be present or absent',
        'an admin cannot use an unsupported attendance status'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', null, null, ''present'')',
        'P0001',
        'Specify either a user or a team, not both',
        'an admin must specify an attendance target'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', ''61000000-0000-4000-8000-000000000003'', ''63000000-0000-4000-8000-000000000001'', ''present'')',
        'P0001',
        'Specify either a user or a team, not both',
        'an admin cannot specify both an individual and a team'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000099'', ''61000000-0000-4000-8000-000000000003'', null, ''present'')',
        'P0001',
        'Event not found',
        'attendance cannot be marked for a nonexistent event'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', null, ''63000000-0000-4000-8000-000000000001'', ''present'')',
        'P0001',
        'Solo events require an individual attendance record',
        'a solo event cannot use a team attendance target'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000002'', ''61000000-0000-4000-8000-000000000003'', null, ''present'')',
        'P0001',
        'Team events require a team attendance record',
        'a team event cannot use an individual attendance target'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000001'', ''61000000-0000-4000-8000-000000000004'', null, ''present'')',
        'P0001',
        'Participant is not registered for this event',
        'a participant without an active registration cannot receive attendance'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000002'', null, ''63000000-0000-4000-8000-000000000002'', ''present'')',
        'P0001',
        'Team does not belong to this event',
        'a team from another event cannot receive attendance'
    );

select
    throws_ok(
        'select public.mark_attendance(''62000000-0000-4000-8000-000000000002'', null, ''63000000-0000-4000-8000-000000000003'', ''present'')',
        'P0001',
        'Team is not registered for this event',
        'a team without an active registration cannot receive attendance'
    );

select
    set_config(
        'test.solo_attendance_id',
        public.mark_attendance(
            '62000000-0000-4000-8000-000000000001',
            '61000000-0000-4000-8000-000000000003',
            null,
            'present'
        ) :: text,
        true
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.attendance
            where
                event_id = '62000000-0000-4000-8000-000000000001'
                and user_id = '61000000-0000-4000-8000-000000000003'
                and team_id is null
                and status = 'present'
                and marked_by = '61000000-0000-4000-8000-000000000001'
        ),
        1,
        'an active admin can mark a registered solo participant present'
    );

select
    is(
        public.mark_attendance(
            '62000000-0000-4000-8000-000000000001',
            '61000000-0000-4000-8000-000000000003',
            null,
            'absent'
        ) :: text,
        current_setting('test.solo_attendance_id'),
        'changing attendance updates and returns the existing record'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.attendance
            where
                event_id = '62000000-0000-4000-8000-000000000001'
                and user_id = '61000000-0000-4000-8000-000000000003'
        ),
        1,
        'changing attendance does not create a duplicate record'
    );

select
    is(
        (
            select
                status
            from
                public.attendance
            where
                id = current_setting('test.solo_attendance_id') :: uuid
        ),
        'absent',
        'the existing attendance status is updated'
    );

select
    set_config(
        'test.team_attendance_id',
        public.mark_attendance(
            '62000000-0000-4000-8000-000000000002',
            null,
            '63000000-0000-4000-8000-000000000001',
            'present'
        ) :: text,
        true
    );

select
    ok(
        exists (
            select
                1
            from
                public.attendance
            where
                id = current_setting('test.team_attendance_id') :: uuid
                and event_id = '62000000-0000-4000-8000-000000000002'
                and user_id is null
                and team_id = '63000000-0000-4000-8000-000000000001'
                and status = 'present'
                and marked_by = '61000000-0000-4000-8000-000000000001'
        ),
        'an active admin can mark a registered team present'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.audit_logs
            where
                admin_id = '61000000-0000-4000-8000-000000000001'
                and action = 'MARK_ATTENDANCE'
                and entity_type = 'attendance'
                and entity_id in (
                    current_setting('test.solo_attendance_id') :: uuid,
                    current_setting('test.team_attendance_id') :: uuid
                )
        ),
        3,
        'each successful mark or update writes an attendance audit record'
    );

reset role;

select
    *
from
    finish();

rollback;