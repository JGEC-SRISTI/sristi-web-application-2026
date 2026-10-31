begin;

select
    plan(4);

select
    ok(
        not exists (
            select
                1
            from
                pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
            where
                n.nspname = 'public'
                and p.prosecdef
                and not exists (
                    select
                        1
                    from
                        unnest(coalesce(p.proconfig, array [] :: text [])) setting
                    where
                        setting like 'search_path=%'
                )
        ),
        'every public SECURITY DEFINER function sets a search_path'
    );

select
    ok(
        not exists (
            select
                1
            from
                pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
            where
                n.nspname = 'public'
                and p.prosecdef
                and p.prorettype <> 'trigger' :: regtype
                and has_function_privilege('anon', p.oid, 'EXECUTE')
        ),
        'anonymous users cannot execute public SECURITY DEFINER functions'
    );

select
    is(
        has_function_privilege('anon', 'public.has_profile()', 'EXECUTE'),
        false,
        'anonymous users cannot execute the unused has_profile helper'
    );

select
    is(
        has_function_privilege(
            'authenticated',
            'public.has_profile()',
            'EXECUTE'
        ),
        false,
        'authenticated users cannot execute the unused has_profile helper'
    );

select
    *
from
    finish();

rollback;