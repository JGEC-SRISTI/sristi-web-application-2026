begin;

select
    plan(6);

select
    is(
        has_function_privilege('anon', 'public.join_team(text)', 'EXECUTE'),
        false,
        'anonymous users cannot execute join_team'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.join_team(text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute join_team'
    );

-- Simulate an authenticated database role without an authenticated user ID.
select
    set_config(
        'request.jwt.claims',
        '{"role":"authenticated"}',
        true
    );

select
    set_config('request.jwt.claim.sub', '', true);

set
    local role authenticated;

select
    throws_ok(
        'select public.join_team(''ANY-CODE'')',
        'P0001',
        'Authentication required',
        'join_team rejects a session without an authenticated user ID'
    );

-- A non-null identity is enough to reach input validation; no team fixture or
-- verified payment is needed because invalid codes must be rejected first.
select
    set_config(
        'request.jwt.claim.sub',
        '10000000-0000-4000-8000-000000000001',
        true
    );

select
    throws_ok(
        'select public.join_team(null)',
        'P0001',
        'Team code cannot be empty',
        'join_team rejects a null team code'
    );

select
    throws_ok(
        'select public.join_team('''')',
        'P0001',
        'Team code cannot be empty',
        'join_team rejects an empty team code'
    );

select
    throws_ok(
        'select public.join_team(''   '')',
        'P0001',
        'Team code cannot be empty',
        'join_team rejects a whitespace-only team code'
    );

select
    *
from
    finish();

rollback;