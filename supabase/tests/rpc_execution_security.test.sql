begin;

select
    plan(48);

-- Keep authenticated RPC access explicit while ensuring anonymous clients do
-- not inherit EXECUTE through PUBLIC on any application-facing function.
select
    is(
        has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
        false,
        'anonymous users cannot execute is_admin'
    );

select
    is(
        has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE'),
        true,
        'authenticated users can execute is_admin'
    );

select
    is(
        has_function_privilege('anon', 'public.is_super_admin()', 'EXECUTE'),
        false,
        'anonymous users cannot execute is_super_admin'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.is_super_admin()',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute is_super_admin'
    );

select
    is(
        has_function_privilege('anon', 'public.is_verified_user()', 'EXECUTE'),
        false,
        'anonymous users cannot execute is_verified_user'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.is_verified_user()',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute is_verified_user'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.is_team_size_valid(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute is_team_size_valid'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.is_team_size_valid(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute is_team_size_valid'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.can_register_team(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute can_register_team'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.can_register_team(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute can_register_team'
    );

select
    is(
        has_function_privilege('anon', 'public.register_team(uuid)', 'EXECUTE'),
        false,
        'anonymous users cannot execute register_team'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.register_team(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute register_team'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.can_register_solo_event(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute can_register_solo_event'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.can_register_solo_event(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute can_register_solo_event'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.register_solo_event(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute register_solo_event'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.register_solo_event(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute register_solo_event'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.can_register_team_event(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute can_register_team_event'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.can_register_team_event(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute can_register_team_event'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.register_team_event(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute register_team_event'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.register_team_event(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute register_team_event'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.create_team(uuid, text, boolean)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute create_team with consent'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.create_team(uuid, text, boolean)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute create_team with consent'
    );

select
    is(
        has_function_privilege('anon', 'public.join_team(text, boolean)', 'EXECUTE'),
        false,
        'anonymous users cannot execute join_team'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.join_team(text, boolean)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute join_team'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.get_team_roster(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute get_team_roster'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.get_team_roster(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute get_team_roster'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.finalize_team_registration(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute finalize_team_registration'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.finalize_team_registration(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute finalize_team_registration'
    );

select
    is(
        has_function_privilege('anon', 'public.generate_team_code()', 'EXECUTE'),
        false,
        'anonymous users cannot execute generate_team_code'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.generate_team_code()',
            'EXECUTE'
        ),
        false,
        'authenticated users cannot call the internal team-code generator directly'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.issue_verification_code(uuid, uuid, text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute issue_verification_code'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.issue_verification_code(uuid, uuid, text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute issue_verification_code'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.verify_participant_code(text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute verify_participant_code'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.verify_participant_code(text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute verify_participant_code'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.verify_offline_payment(uuid, text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute verify_offline_payment'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.verify_offline_payment(uuid, text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute verify_offline_payment'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.declare_result(uuid, uuid, uuid, smallint)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute declare_result'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.declare_result(uuid, uuid, uuid, smallint)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute declare_result'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.mark_attendance(uuid, uuid, uuid, text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute mark_attendance'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.mark_attendance(uuid, uuid, uuid, text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute mark_attendance'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.set_leaderboard_visibility(boolean)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute set_leaderboard_visibility'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.set_leaderboard_visibility(boolean)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute set_leaderboard_visibility'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.create_admin(uuid, text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute create_admin'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.create_admin(uuid, text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute create_admin'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.update_admin(uuid, text, text)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute update_admin'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.update_admin(uuid, text, text)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute update_admin'
    );

select
    is(
        has_function_privilege(
            'anon',
            'public.deactivate_admin(uuid)',
            'EXECUTE'
        ),
        false,
        'anonymous users cannot execute deactivate_admin'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.deactivate_admin(uuid)',
            'EXECUTE'
        ),
        true,
        'authenticated users can execute deactivate_admin'
    );

select
    *
from
    finish();

rollback;
