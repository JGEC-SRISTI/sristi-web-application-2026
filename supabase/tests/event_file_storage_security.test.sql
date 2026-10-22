begin;

select
    plan(13);

-- Local-only users, buckets, and objects are rolled back with this test.
insert into
    auth.users (id, email)
values
    (
        '81000000-0000-4000-8000-000000000001',
        'storage-admin@example.invalid'
    ),
    (
        '81000000-0000-4000-8000-000000000002',
        'storage-inactive-admin@example.invalid'
    ),
    (
        '81000000-0000-4000-8000-000000000003',
        'storage-participant@example.invalid'
    );

insert into
    public.admin_users (user_id, role, status)
values
    (
        '81000000-0000-4000-8000-000000000001',
        'ADMIN',
        'active'
    ),
    (
        '81000000-0000-4000-8000-000000000002',
        'ADMIN',
        'inactive'
    );

insert into
    storage.buckets (id, name, public)
values
    (
        'storage-security-other',
        'storage-security-other',
        false
    ) on conflict (id) do nothing;

insert into
    storage.objects (id, bucket_id, name, metadata)
values
    (
        '82000000-0000-4000-8000-000000000001',
        'event-files',
        'security-test/agenda.pdf',
        '{"source":"fixture"}' :: jsonb
    );

select
    is(
        (
            select
                public
            from
                storage.buckets
            where
                id = 'event-files'
        ),
        false,
        'the event-files bucket is private'
    );

select
    is(
        has_table_privilege('anon', 'storage.objects', 'SELECT'),
        true,
        'anonymous role can query storage rows subject to row-level security'
    );

set
    local role anon;

select
    is(
        (
            select
                count(*) :: integer
            from
                storage.objects
            where
                bucket_id = 'event-files'
        ),
        0,
        'anonymous users cannot read event-file objects'
    );

reset role;

select
    set_config(
        'request.jwt.claims',
        '{"sub":"81000000-0000-4000-8000-000000000003","role":"authenticated"}',
        true
    );

select
    set_config(
        'request.jwt.claim.sub',
        '81000000-0000-4000-8000-000000000003',
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
                storage.objects
            where
                bucket_id = 'event-files'
                and name = 'security-test/agenda.pdf'
        ),
        1,
        'authenticated participants can read event-file objects'
    );

select
    throws_ok(
        'insert into storage.objects (bucket_id, name) values (''event-files'', ''security-test/participant-upload.pdf'')',
        '42501',
        null,
        'a participant cannot upload an event file'
    );

select
    lives_ok(
        'update storage.objects set metadata = ''{"source":"participant-update"}''::jsonb where bucket_id = ''event-files'' and name = ''security-test/agenda.pdf''',
        'a participant cannot update an event file'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '81000000-0000-4000-8000-000000000002',
        true
    );

select
    throws_ok(
        'insert into storage.objects (bucket_id, name) values (''event-files'', ''security-test/inactive-admin-upload.pdf'')',
        '42501',
        null,
        'an inactive admin cannot upload an event file'
    );

select
    set_config(
        'request.jwt.claim.sub',
        '81000000-0000-4000-8000-000000000001',
        true
    );

select
    lives_ok(
        'insert into storage.objects (bucket_id, name, metadata) values (''event-files'', ''security-test/admin-upload.pdf'', ''{"source":"admin"}''::jsonb)',
        'an active admin can upload an event file'
    );

select
    lives_ok(
        'update storage.objects set metadata = ''{"source":"admin-updated"}''::jsonb where bucket_id = ''event-files'' and name = ''security-test/admin-upload.pdf''',
        'an active admin can update an event file'
    );

select
    is(
        (
            select
                metadata ->> 'source'
            from
                storage.objects
            where
                bucket_id = 'event-files'
                and name = 'security-test/admin-upload.pdf'
        ),
        'admin-updated',
        'the admin file update is persisted'
    );

select
    throws_ok(
        'insert into storage.objects (bucket_id, name) values (''storage-security-other'', ''security-test/outside-bucket.txt'')',
        '42501',
        null,
        'an admin cannot upload through this policy to a different bucket'
    );

select
    ok(
        exists (
            select
                1
            from
                pg_policies
            where
                schemaname = 'storage'
                and tablename = 'objects'
                and policyname = 'Admins can delete event files'
                and qual like '%event-files%'
                and qual like '%is_admin%'
        ),
        'the Storage API delete policy limits deletion to admins in this bucket'
    );

reset role;

select
    is(
        (
            select
                metadata ->> 'source'
            from
                storage.objects
            where
                bucket_id = 'event-files'
                and name = 'security-test/agenda.pdf'
        ),
        'fixture',
        'participant write attempts leave the original file unchanged'
    );

select
    *
from
    finish();

rollback;