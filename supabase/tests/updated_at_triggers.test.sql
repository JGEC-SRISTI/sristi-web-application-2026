begin;

select
    plan(9);

-- All rows are local fixtures, and the final rollback leaves the database as
-- it was before this test ran.
insert into
    auth.users (id, email)
values
    (
        'd1000000-0000-4000-8000-000000000001',
        'timestamps-user@example.invalid'
    ),
    (
        'd1000000-0000-4000-8000-000000000002',
        'timestamps-admin@example.invalid'
    );

insert into
    public.profiles (
        id,
        full_name,
        phone,
        college_name,
        college_roll,
        department,
        academic_year,
        updated_at
    )
values
    (
        'd1000000-0000-4000-8000-000000000001',
        'Timestamp Test User',
        '9000000001',
        'Test College',
        'TS-001',
        'Testing',
        2,
        '2000-01-01 00:00:00+00'
    );

insert into
    public.admin_users (user_id, role, status, updated_at)
values
    (
        'd1000000-0000-4000-8000-000000000002',
        'ADMIN',
        'active',
        '2000-01-01 00:00:00+00'
    );

insert into
    public.payment_records (
        user_id,
        amount,
        payment_method,
        status,
        updated_at
    )
values
    (
        'd1000000-0000-4000-8000-000000000001',
        250.00,
        'offline',
        'pending',
        '2000-01-01 00:00:00+00'
    );

-- The local database may already contain the singleton settings row. Replace
-- it only inside this transaction; rollback restores the original row.
delete from
    public.fest_settings
where
    id = 1;

insert into
    public.fest_settings (id, fest_name, fest_fee, updated_at)
values
    (
        1,
        'Timestamp Test Fest',
        250.00,
        '2000-01-01 00:00:00+00'
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
        max_team_size,
        updated_at
    )
values
    (
        'd2000000-0000-4000-8000-000000000001',
        'Timestamp Solo Event',
        'timestamp-solo-event',
        'Short description',
        'Description',
        'solo',
        'Testing',
        'Test Venue',
        null,
        null,
        '2000-01-01 00:00:00+00'
    ),
    (
        'd2000000-0000-4000-8000-000000000002',
        'Timestamp Team Event',
        'timestamp-team-event',
        'Short description',
        'Description',
        'team',
        'Testing',
        'Test Venue',
        3,
        5,
        '2000-01-01 00:00:00+00'
    );

insert into
    public.event_files (
        event_id,
        file_name,
        file_path,
        file_type,
        updated_at
    )
values
    (
        'd2000000-0000-4000-8000-000000000001',
        'rules.pdf',
        'timestamp-test/rules.pdf',
        'application/pdf',
        '2000-01-01 00:00:00+00'
    );

insert into
    public.teams (
        event_id,
        team_name,
        team_code,
        leader_id,
        status,
        updated_at
    )
values
    (
        'd2000000-0000-4000-8000-000000000002',
        'Timestamp Test Team',
        'TIMESTAMP-TEAM-001',
        'd1000000-0000-4000-8000-000000000001',
        'forming',
        '2000-01-01 00:00:00+00'
    );

insert into
    public.registrations (event_id, user_id, status, updated_at)
values
    (
        'd2000000-0000-4000-8000-000000000001',
        'd1000000-0000-4000-8000-000000000001',
        'registered',
        '2000-01-01 00:00:00+00'
    );

-- Likewise, replace the singleton leaderboard row only within this
-- transaction so rollback restores any preexisting setting.
delete from public.leaderboard_settings
where id = 1;

insert into
    public.leaderboard_settings (id, is_public, updated_at)
values
    (1, false, '2000-01-01 00:00:00+00');

update
    public.profiles
set
    full_name = 'Timestamp Test User Updated'
where
    id = 'd1000000-0000-4000-8000-000000000001';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.profiles
            where
                id = 'd1000000-0000-4000-8000-000000000001'
        ),
        'profile updates refresh updated_at'
    );

update
    public.admin_users
set
    role = 'SUPER_ADMIN'
where
    user_id = 'd1000000-0000-4000-8000-000000000002';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.admin_users
            where
                user_id = 'd1000000-0000-4000-8000-000000000002'
        ),
        'admin updates refresh updated_at'
    );

update
    public.payment_records
set
    status = 'rejected'
where
    user_id = 'd1000000-0000-4000-8000-000000000001';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.payment_records
            where
                user_id = 'd1000000-0000-4000-8000-000000000001'
        ),
        'payment updates refresh updated_at'
    );

update
    public.fest_settings
set
    fest_name = 'Timestamp Test Fest Updated'
where
    id = 1;

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.fest_settings
            where
                id = 1
        ),
        'fest settings updates refresh updated_at'
    );

update
    public.events
set
    name = 'Timestamp Solo Event Updated'
where
    id = 'd2000000-0000-4000-8000-000000000001';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.events
            where
                id = 'd2000000-0000-4000-8000-000000000001'
        ),
        'event updates refresh updated_at'
    );

update
    public.event_files
set
    file_name = 'rules-updated.pdf'
where
    file_path = 'timestamp-test/rules.pdf';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.event_files
            where
                file_path = 'timestamp-test/rules.pdf'
        ),
        'event file updates refresh updated_at'
    );

update
    public.teams
set
    team_name = 'Timestamp Test Team Updated'
where
    team_code = 'TIMESTAMP-TEAM-001';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.teams
            where
                team_code = 'TIMESTAMP-TEAM-001'
        ),
        'team updates refresh updated_at'
    );

update
    public.registrations
set
    status = 'cancelled'
where
    event_id = 'd2000000-0000-4000-8000-000000000001'
    and user_id = 'd1000000-0000-4000-8000-000000000001';

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.registrations
            where
                event_id = 'd2000000-0000-4000-8000-000000000001'
                and user_id = 'd1000000-0000-4000-8000-000000000001'
        ),
        'registration updates refresh updated_at'
    );

update
    public.leaderboard_settings
set
    is_public = true
where
    id = 1;

select
    ok(
        (
            select
                updated_at > '2000-01-01 00:00:00+00' :: timestamptz
            from
                public.leaderboard_settings
            where
                id = 1
        ),
        'leaderboard settings updates refresh updated_at'
    );

select
    *
from
    finish();

rollback;
