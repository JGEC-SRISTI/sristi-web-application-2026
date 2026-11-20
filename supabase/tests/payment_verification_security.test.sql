begin;

select
    plan(21);

-- Local-only fixtures; the enclosing transaction rolls them all back.
insert into
    auth.users (id, email)
values
    (
        '12000000-0000-4000-8000-000000000001',
        'payment-admin@example.invalid'
    ),
    (
        '12000000-0000-4000-8000-000000000002',
        'inactive-payment-admin@example.invalid'
    ),
    (
        '12000000-0000-4000-8000-000000000003',
        'payment-participant@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        '12000000-0000-4000-8000-000000000001',
        'ADMIN',
        'active'
    ),
    (
        '12000000-0000-4000-8000-000000000002',
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
        '12000000-0000-4000-8000-000000000003',
        'Payment Test Participant',
        '9200000003',
        'JGEC',
        'P003',
        'CSE',
        3
    );

insert into
    public.fest_settings (id, fest_name, fest_fee)
values
    (1, 'Local Payment Security Test', 500.00) on conflict (id) do
update
set
    fest_name = excluded.fest_name,
    fest_fee = excluded.fest_fee;

select
    is(
        has_function_privilege(
            'anon',
            'public.verify_offline_payment(uuid,text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute offline payment verification'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.verify_offline_payment(uuid,text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded payment verification function'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.issue_verification_code(uuid,uuid,text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot issue verification codes'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.issue_verification_code(uuid,uuid,text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can call the guarded code issuing function'
    );

select
    is(
        has_table_privilege(
            'authenticated',
            'public.payment_records',
            'INSERT'
        ),
        false,
        'authenticated users cannot insert payment records directly'
    );

select
    is(
        has_table_privilege(
            'authenticated',
            'public.payment_records',
            'UPDATE'
        ),
        false,
        'authenticated users cannot update payment records directly'
    );

select
    is(
        has_table_privilege(
            'authenticated',
            'public.payment_records',
            'DELETE'
        ),
        false,
        'authenticated users cannot delete payment records directly'
    );

select
    set_config(
        'request.jwt.claims',
        '{"sub":"12000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000003',
        true
    );

set
    local role authenticated;

select
    throws_ok(
        'select public.verify_offline_payment(''12000000-0000-4000-8000-000000000003''::uuid, ''REF-TEST'')',
        'P0001',
        'Only admins can verify offline payments',
        'a participant cannot verify their own payment'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000002',
        true
    );

select
    throws_ok(
        'select public.verify_offline_payment(''12000000-0000-4000-8000-000000000003''::uuid, ''REF-TEST'')',
        'P0001',
        'Only admins can verify offline payments',
        'an inactive admin cannot verify a payment'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000003',
        true
    );

select
    throws_ok(
        'select public.issue_verification_code(''12000000-0000-4000-8000-000000000003''::uuid, ''13000000-0000-4000-8000-000000000001''::uuid, null)',
        'P0001',
        'Only admins can issue verification codes',
        'a participant cannot issue a verification code'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000001',
        true
    );

select
    set_config(
        'test.payment_id',
        public.verify_offline_payment(
            '12000000-0000-4000-8000-000000000003',
            ' REF-TEST-001 '
        ) :: text,
        true
    );

reset role;

select
    ok(
        exists (
            select
                1
            from
                public.payment_records
            where
                id = current_setting('test.payment_id') :: uuid
                and user_id = '12000000-0000-4000-8000-000000000003'
                and amount = 500.00
                and payment_method = 'offline'
                and status = 'verified'
                and payment_reference = 'REF-TEST-001'
                and verified_by = '12000000-0000-4000-8000-000000000001'
                and verified_at is not null
        ),
        'payment verification uses the configured fee and records verifier details'
    );

select
    ok(
        exists (
            select
                1
            from
                public.audit_logs
            where
                admin_id = '12000000-0000-4000-8000-000000000001'
                and action = 'VERIFY_OFFLINE_PAYMENT'
                and entity_type = 'payment'
                and entity_id = current_setting('test.payment_id') :: uuid
                and metadata ->> 'user_id' = '12000000-0000-4000-8000-000000000003'
        ),
        'successful payment verification is audited'
    );

set
    local role authenticated;

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000001',
        true
    );

select
    throws_ok(
        'select public.verify_offline_payment(''12000000-0000-4000-8000-000000000003''::uuid, ''REF-SECOND'')',
        'P0001',
        'Participant already has a verified payment',
        'a participant cannot receive a second verified payment'
    );

select
    set_config(
        'test.code_id',
        public.issue_verification_code(
            '12000000-0000-4000-8000-000000000003',
            current_setting('test.payment_id') :: uuid,
            null
        ) :: text,
        true
    );

select
    ok(
        current_setting('test.code_id') <> '',
        'the admin can issue a generated verification code'
    );

select
    set_config(
        'test.code',
        (
            select
                code
            from
                public.verification_codes
            where
                id = current_setting('test.code_id') :: uuid
        ),
        true
    );

reset role;

select
    ok(
        exists (
            select
                1
            from
                public.verification_codes
            where
                id = current_setting('test.code_id') :: uuid
                and user_id = '12000000-0000-4000-8000-000000000003'
                and payment_id = current_setting('test.payment_id') :: uuid
                and status = 'issued'
        ),
        'the issued code is tied to the verified payment and its participant'
    );

select
    ok(
        exists (
            select
                1
            from
                public.audit_logs
            where
                admin_id = '12000000-0000-4000-8000-000000000001'
                and action = 'ISSUE_VERIFICATION_CODE'
                and entity_id = current_setting('test.code_id') :: uuid
                and metadata ->> 'custom_code' = 'false'
                and metadata :: text not like '%' || current_setting('test.code') || '%'
        ),
        'code issuance is audited without writing the plaintext code to audit metadata'
    );

set
    local role authenticated;

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000001',
        true
    );

select
    throws_ok(
        'select public.issue_verification_code(''12000000-0000-4000-8000-000000000003''::uuid, current_setting(''test.payment_id'')::uuid, null)',
        'P0001',
        'User already has an issued verification code',
        'a participant cannot receive multiple active verification codes'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '12000000-0000-4000-8000-000000000003',
        true
    );

select
    is(
        (
            select
                count(*) :: integer
            from
                public.verification_codes
        ),
        0,
        'participants cannot directly read their verification codes'
    );

select
    is(
        public.verify_participant_code(current_setting('test.code')),
        true,
        'the participant can consume the code issued for their verified payment'
    );

select
    is(
        public.is_verified_user(),
        true,
        'consuming the code makes the participant eligible'
    );

select
    throws_ok(
        'select public.verify_participant_code(current_setting(''test.code''))',
        'P0001',
        'Invalid or already used verification code',
        'a consumed verification code cannot be reused'
    );

select
    *
from
    finish();

rollback;