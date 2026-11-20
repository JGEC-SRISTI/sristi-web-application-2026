-- A CHECK expression that evaluates to NULL passes in PostgreSQL. Explicitly
-- require team size bounds so team events cannot be stored with NULL values.
alter table public.events
drop constraint if exists events_check;

alter table public.events
add constraint events_team_size_rules_check check (
    (
        event_type = 'solo'
        and min_team_size is null
        and max_team_size is null
    )
    or (
        event_type = 'team'
        and min_team_size is not null
        and max_team_size is not null
        and min_team_size = 3
        and max_team_size = 5
    )
) not valid;
