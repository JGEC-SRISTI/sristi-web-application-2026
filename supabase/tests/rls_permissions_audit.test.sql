begin;

select
    plan(2);

-- Audit every application table, so a newly added public table cannot silently
-- bypass row-level security or be left without any policy definitions.
select
    ok(
        not exists (
            select
                1
            from
                pg_class c
                join pg_namespace n on n.oid = c.relnamespace
            where
                n.nspname = 'public'
                and c.relkind in ('r', 'p')
                and not c.relrowsecurity
        ),
        'every public table has row-level security enabled'
    );

select
    ok(
        not exists (
            select
                1
            from
                pg_class c
                join pg_namespace n on n.oid = c.relnamespace
            where
                n.nspname = 'public'
                and c.relkind in ('r', 'p')
                and not exists (
                    select
                        1
                    from
                        pg_policy p
                    where
                        p.polrelid = c.oid
                )
        ),
        'every public table has at least one row-level security policy'
    );

select
    *
from
    finish();

rollback;