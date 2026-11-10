begin;

select
    plan(10);

-- Fixed local-only identities keep this test deterministic. The transaction
-- rolls these fixtures back after the assertions finish.
insert into
    auth.users (id, email)
values
    (
        '10000000-0000-4000-8000-000000000001',
        'profile-test-a@example.invalid'
    ),
    (
        '10000000-0000-4000-8000-000000000002',
        'profile-test-b@example.invalid'
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
        '10000000-0000-4000-8000-000000000001',
        'Participant A',
        '9000000001',
        'JGEC',
        'A001',
        'CSE',
        3
    ),
    (
        '10000000-0000-4000-8000-000000000002',
        'Participant B',
        '9000000002',
        'JGEC',
        'B001',
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
        venue
    )
values
    (
        '20000000-0000-4000-8000-000000000001',
        'Local profile security test',
        'local-profile-security-test',
        'Local test event',
        'Local test fixture; rolled back with this test.',
        'solo',
        'Test',
        'Local'
    );

insert into
    public.payment_records (
        id,
        user_id,
        amount,
        payment_method,
        status
    )
values
    (
        '30000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000001',
        100,
        'offline',
        'verified'
    );

insert into
    public.verification_codes (
        id,
        code,
        user_id,
        payment_id,
        status
    )
values
    (
        '40000000-0000-4000-8000-000000000001',
        'LOCAL-TEST-CODE',
        '10000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000001',
        'issued'
    );

select
    set_config(
        'request.jwt.claims',
        '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '10000000-0000-4000-8000-000000000001',
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
                public.profiles
        ),
        1,
        'a participant can see only their own profile'
    );

select
    throws_ok(
        $profile_spoof$
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
                '10000000-0000-4000-8000-000000000002',
                'Spoofed profile',
                '9000000003',
                'JGEC',
                'X001',
                'CSE',
                1
            ) $profile_spoof$,
            '42501',
            null,
            'a participant cannot create another user profile'
    );

update public.profiles
set full_name = 'Unauthorized change'
where id = '10000000-0000-4000-8000-000000000002';

reset role;

select
    is(
        (
            select full_name
            from public.profiles
            where id = '10000000-0000-4000-8000-000000000002'
        ),
        'Participant B',
        'a participant cannot update another user profile'
    );

set local role authenticated;

select
    is(
        public.is_verified_user(),
        false,
        'verified payment alone does not enable registration'
    );

select
    throws_ok(
        $registration_blocked$
        select
            public.register_solo_event('20000000-0000-4000-8000-000000000001') $registration_blocked$,
            'P0001',
            'User cannot register for this solo event',
            'registration is blocked until the participant consumes their code'
    );

select
    is(
        public.verify_participant_code('LOCAL-TEST-CODE'),
        true,
        'a participant can consume their own issued code'
    );

select
    is(
        public.is_verified_user(),
        true,
        'consuming the linked code enables eligibility'
    );

select
    throws_ok(
        $code_replay$
        select
            public.verify_participant_code('LOCAL-TEST-CODE') $code_replay$,
            'P0001',
            'Invalid or already used verification code',
            'a consumed code cannot be reused'
    );

select
    ok(
        public.register_solo_event('20000000-0000-4000-8000-000000000001') is not null,
        'an eligible participant can register for a solo event'
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.registrations
        ),
        1,
        'the successful RPC persisted one registration'
    );

select
    *
from
    finish();

rollback;
