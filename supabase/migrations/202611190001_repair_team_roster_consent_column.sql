begin;

-- The deployed get_team_roster(uuid) expects this column. Add it safely to
-- environments where its prerequisite migration was not applied.
alter table public.team_members
    add column if not exists member_info_consent boolean not null default false;

commit;
