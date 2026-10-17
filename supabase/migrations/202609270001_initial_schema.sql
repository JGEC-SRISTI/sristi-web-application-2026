-- ============================================================
-- SRISTI 2K26
-- Initial Database Schema...
-- ============================================================
-- ------------------------------------------------------------
-- 1. Extensions
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 2. Common updated_at trigger
-- ------------------------------------------------------------
create
or replace function public.set_updated_at() returns trigger language plpgsql as $ $ begin new.updated_at = now();

return new;

end;

$ $;

-- ------------------------------------------------------------
-- 3. Profiles
-- ------------------------------------------------------------
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    phone text not null,
    college_name text not null,
    college_roll text not null,
    department text not null,
    academic_year smallint not null check (
        academic_year between 1
        and 4
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Automatically update updated_at when a profile changes
create trigger set_profiles_updated_at before
update
    on public.profiles for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. Admin Users
-- ------------------------------------------------------------
create table public.admin_users (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    role text not null default 'ADMIN' check (role in ('SUPER_ADMIN', 'ADMIN')),
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete
    set
        null
);

-- Automatically update updated_at when an admin changes
create trigger set_admin_users_updated_at before
update
    on public.admin_users for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Payment Records
-- ------------------------------------------------------------
create table public.payment_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    amount numeric(10, 2) not null check (amount > 0),
    payment_method text not null default 'offline' check (payment_method in ('offline', 'razorpay')),
    status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
    payment_reference text,
    verified_by uuid references public.admin_users(user_id) on delete
    set
        null,
        verified_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
);

-- Automatically update updated_at when a payment changes
create trigger set_payment_records_updated_at before
update
    on public.payment_records for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6. Verification Codes
-- ------------------------------------------------------------
create table public.verification_codes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    user_id uuid not null references public.profiles(id) on delete cascade,
    payment_id uuid not null references public.payment_records(id) on delete cascade,
    status text not null default 'issued' check (status in ('issued', 'used', 'revoked')),
    created_at timestamptz not null default now(),
    used_at timestamptz
);

-- ------------------------------------------------------------
-- 7. Fest Settings
-- ------------------------------------------------------------
create table public.fest_settings (
    id smallint primary key default 1 check (id = 1),
    fest_name text not null default 'SRISTI 2K26',
    fest_fee numeric(10, 2) not null check (fest_fee >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Automatically update updated_at when fest settings change
create trigger set_fest_settings_updated_at before
update
    on public.fest_settings for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 8. Events
-- ------------------------------------------------------------
create table public.events (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    short_description text not null,
    description text not null,
    event_type text not null check (event_type in ('solo', 'team')),
    category text not null,
    venue text not null,
    min_team_size smallint,
    max_team_size smallint,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- Solo events must not have team-size values.
    -- Team events must allow exactly 3 to 5 members.
    check (
        (
            event_type = 'solo'
            and min_team_size is null
            and max_team_size is null
        )
        or (
            event_type = 'team'
            and min_team_size = 3
            and max_team_size = 5
        )
    )
);

-- Automatically update updated_at when an event changes
create trigger set_events_updated_at before
update
    on public.events for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 9. Event Files
-- ------------------------------------------------------------
create table public.event_files (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    file_name text not null,
    file_path text not null,
    file_type text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Automatically update updated_at when an event file changes
create trigger set_event_files_updated_at before
update
    on public.event_files for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 10. Teams
-- ------------------------------------------------------------
create table public.teams (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    team_name text not null,
    team_code text not null unique,
    leader_id uuid not null references public.profiles(id) on delete restrict,
    status text not null default 'forming' check (status in ('forming', 'registered', 'cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- A team name must be unique within an event.
    unique (event_id, team_name)
);

-- Automatically update updated_at when a team changes
create trigger set_teams_updated_at before
update
    on public.teams for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 11. Team Members
-- ------------------------------------------------------------
create table public.team_members (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    -- A user can appear only once in a particular team.
    unique (team_id, user_id)
);

-- ------------------------------------------------------------
-- 12. Registrations
-- ------------------------------------------------------------
create table public.registrations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    team_id uuid references public.teams(id) on delete cascade,
    status text not null default 'registered' check (status in ('registered', 'cancelled')),
    registered_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- Exactly one registration target is allowed:
    -- either an individual user OR a team.
    check (
        (
            user_id is not null
            and team_id is null
        )
        or (
            user_id is null
            and team_id is not null
        )
    )
);

-- Automatically update updated_at when a registration changes
create trigger set_registrations_updated_at before
update
    on public.registrations for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 13. Attendance
-- ------------------------------------------------------------
create table public.attendance (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    team_id uuid references public.teams(id) on delete cascade,
    status text not null default 'present' check (status in ('present', 'absent')),
    marked_at timestamptz not null default now(),
    marked_by uuid not null references public.admin_users(user_id) on delete restrict,
    -- Exactly one attendance target:
    -- either an individual user OR a team.
    check (
        (
            user_id is not null
            and team_id is null
        )
        or (
            user_id is null
            and team_id is not null
        )
    )
);

-- ------------------------------------------------------------
-- 14. Results
-- ------------------------------------------------------------
create table public.results (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    team_id uuid references public.teams(id) on delete cascade,
    position smallint not null check (
        position between 1
        and 3
    ),
    declared_at timestamptz not null default now(),
    declared_by uuid not null references public.admin_users(user_id) on delete restrict,
    -- Exactly one result target:
    -- either an individual user OR a team.
    check (
        (
            user_id is not null
            and team_id is null
        )
        or (
            user_id is null
            and team_id is not null
        )
    ),
    -- Only one 1st, one 2nd and one 3rd place
    -- can exist for a particular event.
    unique (event_id, position)
);

-- ------------------------------------------------------------
-- 15. Leaderboard Settings
-- ------------------------------------------------------------
create table public.leaderboard_settings (
    id smallint primary key default 1 check (id = 1),
    is_public boolean not null default false,
    published_at timestamptz,
    updated_at timestamptz not null default now(),
    updated_by uuid references public.admin_users(user_id) on delete
    set
        null
);

-- Automatically update updated_at when leaderboard settings change
create trigger set_leaderboard_settings_updated_at before
update
    on public.leaderboard_settings for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 16. Audit Logs
-- ------------------------------------------------------------
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid not null references public.admin_users(user_id) on delete restrict,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb not null default '{}' :: jsonb,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 17. Indexes and Uniqueness Rules
-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- Payment Records
-- ------------------------------------------------------------
-- A participant can have only one verified payment.
create unique index one_verified_payment_per_user on public.payment_records (user_id)
where
    status = 'verified';

-- ------------------------------------------------------------
-- Verification Codes
-- ------------------------------------------------------------
-- A participant can have only one currently issued code.
create unique index one_issued_verification_code_per_user on public.verification_codes (user_id)
where
    status = 'issued';

-- ------------------------------------------------------------
-- Registrations
-- ------------------------------------------------------------
-- A participant can register only once for the same event.
create unique index one_active_solo_registration_per_event on public.registrations (event_id, user_id)
where
    user_id is not null
    and status = 'registered';

-- A team can register only once for the same event.
create unique index one_active_team_registration_per_event on public.registrations (event_id, team_id)
where
    team_id is not null
    and status = 'registered';

-- ------------------------------------------------------------
-- Attendance
-- ------------------------------------------------------------
-- One attendance record per individual for an event.
create unique index one_user_attendance_per_event on public.attendance (event_id, user_id)
where
    user_id is not null;

-- One attendance record per team for an event.
create unique index one_team_attendance_per_event on public.attendance (event_id, team_id)
where
    team_id is not null;

-- ------------------------------------------------------------
-- Common query indexes
-- ------------------------------------------------------------
create index idx_payment_records_user_id on public.payment_records (user_id);

create index idx_verification_codes_user_id on public.verification_codes (user_id);

create index idx_teams_event_id on public.teams (event_id);

create index idx_team_members_team_id on public.team_members (team_id);

create index idx_team_members_user_id on public.team_members (user_id);

create index idx_registrations_event_id on public.registrations (event_id);

create index idx_registrations_user_id on public.registrations (user_id);

create index idx_registrations_team_id on public.registrations (team_id);

create index idx_attendance_event_id on public.attendance (event_id);

create index idx_results_event_id on public.results (event_id);

create index idx_results_user_id on public.results (user_id);

create index idx_results_team_id on public.results (team_id);

create index idx_audit_logs_admin_id on public.audit_logs (admin_id);

create index idx_audit_logs_created_at on public.audit_logs (created_at);

-- ------------------------------------------------------------
-- 18. Individual Leaderboard
-- ------------------------------------------------------------
create
or replace view public.individual_leaderboard as
select
    user_id,
    full_name,
    college_name,
    sum(total_points) :: bigint as total_points
from
    (
        -- --------------------------------------------------------
        -- Solo event results
        -- --------------------------------------------------------
        select
            r.user_id,
            p.full_name,
            p.college_name,
            coalesce(
                sum(
                    case
                        when r.position = 1 then 3
                        when r.position = 2 then 2
                        when r.position = 3 then 1
                        else 0
                    end
                ),
                0
            ) :: bigint as total_points
        from
            public.results r
            join public.profiles p on p.id = r.user_id
        where
            r.user_id is not null
        group by
            r.user_id,
            p.full_name,
            p.college_name
        union
        all -- --------------------------------------------------------
        -- Team event results
        -- Every team member receives the same points.
        -- --------------------------------------------------------
        select
            tm.user_id,
            p.full_name,
            p.college_name,
            coalesce(
                sum(
                    case
                        when r.position = 1 then 3
                        when r.position = 2 then 2
                        when r.position = 3 then 1
                        else 0
                    end
                ),
                0
            ) :: bigint as total_points
        from
            public.results r
            join public.team_members tm on tm.team_id = r.team_id
            join public.profiles p on p.id = tm.user_id
        where
            r.team_id is not null
        group by
            tm.user_id,
            p.full_name,
            p.college_name
    ) as participant_points
group by
    user_id,
    full_name,
    college_name;

-- ------------------------------------------------------------
-- 19. Default Settings
-- ------------------------------------------------------------
-- Initial fest configuration.
-- Update the fest fee before production use.
insert into
    public.fest_settings (id, fest_name, fest_fee)
values
    (1, 'SRISTI 2K26', 0);

-- Leaderboard remains private until an admin publishes it.
insert into
    public.leaderboard_settings (id, is_public)
values
    (1, false);

-- ------------------------------------------------------------
-- 20. Security Helper Functions
-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- Check whether the current user is an active admin
-- ------------------------------------------------------------
create
or replace function public.is_admin() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.admin_users
        where
            user_id = auth.uid()
            and status = 'active'
    );

$ $;

-- ------------------------------------------------------------
-- Check whether the current user is a SUPER_ADMIN
-- ------------------------------------------------------------
create
or replace function public.is_super_admin() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.admin_users
        where
            user_id = auth.uid()
            and role = 'SUPER_ADMIN'
            and status = 'active'
    );

$ $;

-- ------------------------------------------------------------
-- Check whether the current user has a profile
-- ------------------------------------------------------------
create
or replace function public.has_profile() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.profiles
        where
            id = auth.uid()
    );

$ $;

-- ------------------------------------------------------------
-- Check whether the current user has a verified payment
-- ------------------------------------------------------------
create
or replace function public.is_verified_user() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.payment_records
        where
            user_id = auth.uid()
            and status = 'verified'
    );

$ $;

-- ------------------------------------------------------------
-- 21. Enable Row Level Security
-- ------------------------------------------------------------
alter table
    public.profiles enable row level security;

alter table
    public.admin_users enable row level security;

alter table
    public.payment_records enable row level security;

alter table
    public.verification_codes enable row level security;

alter table
    public.fest_settings enable row level security;

alter table
    public.events enable row level security;

alter table
    public.event_files enable row level security;

alter table
    public.teams enable row level security;

alter table
    public.team_members enable row level security;

alter table
    public.registrations enable row level security;

alter table
    public.attendance enable row level security;

alter table
    public.results enable row level security;

alter table
    public.leaderboard_settings enable row level security;

alter table
    public.audit_logs enable row level security;

-- ------------------------------------------------------------
-- 22. Profiles RLS Policies
-- ------------------------------------------------------------
-- Users can view their own profile.
create policy "Users can view own profile" on public.profiles for
select
    to authenticated using (id = auth.uid());

-- Users can create their own profile.
create policy "Users can create own profile" on public.profiles for
insert
    to authenticated with check (id = auth.uid());

-- Users can update their own profile.
create policy "Users can update own profile" on public.profiles for
update
    to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Admins can view all profiles.
create policy "Admins can view all profiles" on public.profiles for
select
    to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 23. Admin Users RLS Policies
-- ------------------------------------------------------------
-- An active admin can view admin accounts.
create policy "Admins can view admin users" on public.admin_users for
select
    to authenticated using (public.is_admin());

-- Only SUPER_ADMIN can create another admin.
create policy "Super admins can create admin users" on public.admin_users for
insert
    to authenticated with check (public.is_super_admin());

-- Only SUPER_ADMIN can update admin accounts.
create policy "Super admins can update admin users" on public.admin_users for
update
    to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- Only SUPER_ADMIN can remove an admin account.
create policy "Super admins can delete admin users" on public.admin_users for delete to authenticated using (public.is_super_admin());

-- ------------------------------------------------------------
-- 24. Payment Records RLS Policies
-- ------------------------------------------------------------
-- Participants can view their own payment records.
create policy "Users can view own payment records" on public.payment_records for
select
    to authenticated using (user_id = auth.uid());

-- Admins can view all payment records.
create policy "Admins can view all payment records" on public.payment_records for
select
    to authenticated using (public.is_admin());

-- Only admins can create payment records.
create policy "Admins can create payment records" on public.payment_records for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update payment records.
create policy "Admins can update payment records" on public.payment_records for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete payment records.
create policy "Admins can delete payment records" on public.payment_records for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 25. Verification Codes RLS Policies
-- ------------------------------------------------------------
-- Participants can view their own verification code.
create policy "Users can view own verification codes" on public.verification_codes for
select
    to authenticated using (user_id = auth.uid());

-- Admins can view all verification codes.
create policy "Admins can view all verification codes" on public.verification_codes for
select
    to authenticated using (public.is_admin());

-- Only admins can create verification codes.
create policy "Admins can create verification codes" on public.verification_codes for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update verification codes.
create policy "Admins can update verification codes" on public.verification_codes for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete verification codes.
create policy "Admins can delete verification codes" on public.verification_codes for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 26. Fest Settings RLS Policies
-- ------------------------------------------------------------
-- Everyone can view the fest settings.
create policy "Anyone can view fest settings" on public.fest_settings for
select
    to anon,
    authenticated using (true);

-- Only admins can create fest settings.
create policy "Admins can create fest settings" on public.fest_settings for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update fest settings.
create policy "Admins can update fest settings" on public.fest_settings for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete fest settings.
create policy "Admins can delete fest settings" on public.fest_settings for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 27. Events RLS Policies
-- ------------------------------------------------------------
-- Everyone can view events.
create policy "Anyone can view events" on public.events for
select
    to anon,
    authenticated using (true);

-- Only admins can create events.
create policy "Admins can create events" on public.events for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update events.
create policy "Admins can update events" on public.events for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete events.
create policy "Admins can delete events" on public.events for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 28. Event Files RLS Policies
-- ------------------------------------------------------------
-- Everyone can view event file metadata.
create policy "Anyone can view event files" on public.event_files for
select
    to anon,
    authenticated using (true);

-- Only admins can create event file records.
create policy "Admins can create event files" on public.event_files for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update event file records.
create policy "Admins can update event files" on public.event_files for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete event file records.
create policy "Admins can delete event files" on public.event_files for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 29. Teams RLS Policies
-- ------------------------------------------------------------
-- Users can view teams they lead or have joined; admins can view all teams.
create policy "Authenticated users can view teams" on public.teams for
select
    to authenticated using (
        public.is_admin()
        or leader_id = auth.uid()
        or exists (
            select
                1
            from
                public.team_members tm
            where
                tm.team_id = teams.id
                and tm.user_id = auth.uid()
        )
    );

-- Verified users can create teams.
create policy "Verified users can create teams" on public.teams for
insert
    to authenticated with check (public.is_verified_user());

-- Team leaders can update their own teams.
create policy "Team leaders can update own teams" on public.teams for
update
    to authenticated using (leader_id = auth.uid()) with check (leader_id = auth.uid());

-- Admins can update any team.
create policy "Admins can update teams" on public.teams for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Team leaders can delete their own teams.
create policy "Team leaders can delete own teams" on public.teams for delete to authenticated using (leader_id = auth.uid());

-- Admins can delete teams.
create policy "Admins can delete teams" on public.teams for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 30. Team Members RLS Policies
-- ------------------------------------------------------------
-- Users can view their own membership; admins can view all memberships.
create policy "Authenticated users can view team members" on public.team_members for
select
    to authenticated using (
        user_id = auth.uid()
        or public.is_admin()
    );

-- Verified users can join teams.
create policy "Verified users can join teams" on public.team_members for
insert
    to authenticated with check (
        user_id = auth.uid()
        and public.is_verified_user()
    );

-- Users can leave their own team.
create policy "Users can leave own team" on public.team_members for delete to authenticated using (user_id = auth.uid());

-- Admins can remove any team member.
create policy "Admins can delete team members" on public.team_members for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 31. Registrations RLS Policies
-- ------------------------------------------------------------
-- Users can view their own registrations.
create policy "Users can view own registrations" on public.registrations for
select
    to authenticated using (user_id = auth.uid());

-- Team leaders can view registrations for their teams.
create policy "Team leaders can view own team registrations" on public.registrations for
select
    to authenticated using (
        team_id is not null
        and exists (
            select
                1
            from
                public.teams t
            where
                t.id = registrations.team_id
                and t.leader_id = auth.uid()
        )
    );

-- Admins can view all registrations.
create policy "Admins can view all registrations" on public.registrations for
select
    to authenticated using (public.is_admin());

-- Verified users can create registrations.
create policy "Verified users can create registrations" on public.registrations for
insert
    to authenticated with check (public.is_verified_user());

-- Users can update their own registrations.
create policy "Users can update own registrations" on public.registrations for
update
    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admins can update any registration.
create policy "Admins can update registrations" on public.registrations for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admins can delete registrations.
create policy "Admins can delete registrations" on public.registrations for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 32. Attendance RLS Policies
-- ------------------------------------------------------------
-- Participants can view their own attendance.
create policy "Users can view own attendance" on public.attendance for
select
    to authenticated using (user_id = auth.uid());

-- Team leaders can view attendance for their teams.
create policy "Team leaders can view own team attendance" on public.attendance for
select
    to authenticated using (
        team_id is not null
        and exists (
            select
                1
            from
                public.teams t
            where
                t.id = attendance.team_id
                and t.leader_id = auth.uid()
        )
    );

-- Admins can view all attendance.
create policy "Admins can view all attendance" on public.attendance for
select
    to authenticated using (public.is_admin());

-- Only admins can mark attendance.
create policy "Admins can create attendance" on public.attendance for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update attendance.
create policy "Admins can update attendance" on public.attendance for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete attendance.
create policy "Admins can delete attendance" on public.attendance for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 33. Results RLS Policies
-- ------------------------------------------------------------
-- Participants can view their own results.
create policy "Users can view own results" on public.results for
select
    to authenticated using (user_id = auth.uid());

-- Team leaders can view results for their teams.
create policy "Team leaders can view own team results" on public.results for
select
    to authenticated using (
        team_id is not null
        and exists (
            select
                1
            from
                public.teams t
            where
                t.id = results.team_id
                and t.leader_id = auth.uid()
        )
    );

-- Admins can view all results.
create policy "Admins can view all results" on public.results for
select
    to authenticated using (public.is_admin());

-- Only admins can declare results.
create policy "Admins can create results" on public.results for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update results.
create policy "Admins can update results" on public.results for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete results.
create policy "Admins can delete results" on public.results for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 34. Leaderboard Settings RLS Policies
-- ------------------------------------------------------------
-- Everyone can view leaderboard publication status.
create policy "Anyone can view leaderboard settings" on public.leaderboard_settings for
select
    to anon,
    authenticated using (true);

-- Only admins can create leaderboard settings.
create policy "Admins can create leaderboard settings" on public.leaderboard_settings for
insert
    to authenticated with check (public.is_admin());

-- Only admins can update leaderboard settings.
create policy "Admins can update leaderboard settings" on public.leaderboard_settings for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete leaderboard settings.
create policy "Admins can delete leaderboard settings" on public.leaderboard_settings for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 35. Audit Logs RLS Policies
-- ------------------------------------------------------------
-- Only admins can view audit logs.
create policy "Admins can view audit logs" on public.audit_logs for
select
    to authenticated using (public.is_admin());

-- Only admins can create audit logs.
create policy "Admins can create audit logs" on public.audit_logs for
insert
    to authenticated with check (
        public.is_admin()
        and admin_id = auth.uid()
    );

-- Only admins can update audit logs.
create policy "Admins can update audit logs" on public.audit_logs for
update
    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only admins can delete audit logs.
create policy "Admins can delete audit logs" on public.audit_logs for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 36. Security Helper Functions
-- ------------------------------------------------------------
-- Returns true when the current authenticated user
-- has an active admin account.
create
or replace function public.is_admin() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.admin_users
        where
            user_id = auth.uid()
            and status = 'active'
    );

$ $;

-- ------------------------------------------------------------
-- 37. Super Admin Security Helper
-- ------------------------------------------------------------
-- Returns true when the current authenticated user
-- is an active SUPER_ADMIN.
create
or replace function public.is_super_admin() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.admin_users
        where
            user_id = auth.uid()
            and role = 'SUPER_ADMIN'
            and status = 'active'
    );

$ $;

-- ------------------------------------------------------------
-- 38. Verified User Security Helper
-- ------------------------------------------------------------
-- Returns true when the current authenticated user
-- has a verified offline payment.
create
or replace function public.is_verified_user() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.payment_records
        where
            user_id = auth.uid()
            and status = 'verified'
    );

$ $;

-- ------------------------------------------------------------
-- 39. Security Helper Function Permissions
-- ------------------------------------------------------------
-- Remove default function execution privileges.
revoke execute on function public.is_admin()
from
    public;

revoke execute on function public.is_super_admin()
from
    public;

revoke execute on function public.is_verified_user()
from
    public;

-- Prevent anonymous users from calling security helper functions.
revoke execute on function public.is_admin()
from
    anon;

revoke execute on function public.is_super_admin()
from
    anon;

revoke execute on function public.is_verified_user()
from
    anon;

-- Allow authenticated users to use these functions.
grant execute on function public.is_admin() to authenticated;

grant execute on function public.is_super_admin() to authenticated;

grant execute on function public.is_verified_user() to authenticated;

-- ------------------------------------------------------------
-- 40. Prevent Multiple Teams Per Event
-- ------------------------------------------------------------
-- Prevent a user from joining more than one team
-- for the same event.
create
or replace function public.prevent_multiple_teams_per_event() returns trigger language plpgsql security definer
set
    search_path = public as $ $ declare v_event_id uuid;

begin
select
    event_id into v_event_id
from
    public.teams
where
    id = new.team_id;

if v_event_id is null then raise exception 'Team not found';

end if;

-- Use the same user + event lock key as join_team().
perform pg_advisory_xact_lock(
    hashtextextended(
        new.user_id :: text || ':' || v_event_id :: text,
        0
    )
);

if exists (
    select
        1
    from
        public.team_members existing_member
        join public.teams existing_team on existing_team.id = existing_member.team_id
    where
        existing_member.user_id = new.user_id
        and existing_team.event_id = v_event_id
        and existing_member.team_id <> new.team_id
        and (
            tg_op = 'INSERT'
            or existing_member.id is distinct
            from
                new.id
        )
) then raise exception 'User is already a member of another team for this event';

end if;

return new;

end;

$ $;

create trigger prevent_multiple_teams_per_event before
insert
    or
update
    on public.team_members for each row execute function public.prevent_multiple_teams_per_event();

-- ------------------------------------------------------------
-- 41. Team Size Validation Helper
-- ------------------------------------------------------------
-- Returns true when a team has a valid size for registration.
create
or replace function public.is_team_size_valid(p_team_id uuid) returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    count(*) between 3
    and 5
from
    public.team_members
where
    team_id = p_team_id;

$ $;

-- Allow authenticated users to use the team-size helper.
revoke execute on function public.is_team_size_valid(uuid)
from
    anon;

grant execute on function public.is_team_size_valid(uuid) to authenticated;

-- ------------------------------------------------------------
-- 42. Team Registration Validation Helper
-- ------------------------------------------------------------
-- Returns true when the current user is the leader of the team
-- and the team has a valid size for registration.
create
or replace function public.can_register_team(p_team_id uuid) returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.teams t
        where
            t.id = p_team_id
            and t.leader_id = auth.uid()
            and t.status = 'forming'
            and public.is_team_size_valid(t.id)
    );

$ $;

-- Allow authenticated users to use the team-registration helper.
revoke execute on function public.can_register_team(uuid)
from
    anon;

grant execute on function public.can_register_team(uuid) to authenticated;

-- ------------------------------------------------------------
-- 43. Team Registration Function
-- ------------------------------------------------------------
-- Registers a team after validating the leader and team size.
create
or replace function public.register_team(p_team_id uuid) returns boolean language plpgsql security definer
set
    search_path = public as $ $ begin -- Serialize team registration with concurrent membership changes.
    perform pg_advisory_xact_lock(
        hashtextextended(p_team_id :: text, 0)
    );

if not public.can_register_team(p_team_id) then raise exception 'Team cannot be registered';

end if;

update
    public.teams
set
    status = 'registered',
    updated_at = now()
where
    id = p_team_id;

return true;

end;

$ $;

-- Allow authenticated users to call team registration.
revoke execute on function public.register_team(uuid)
from
    anon;

grant execute on function public.register_team(uuid) to authenticated;

-- ------------------------------------------------------------
-- 44. Team Registration Function Permissions
-- ------------------------------------------------------------
-- Prevent direct execution by PUBLIC.
revoke execute on function public.register_team(uuid)
from
    public;

-- Allow authenticated users to register teams.
grant execute on function public.register_team(uuid) to authenticated;

-- ------------------------------------------------------------
-- 45. Registration Validation Helper
-- ------------------------------------------------------------
-- Returns true when the current user can register individually
-- for a solo event.
create
or replace function public.can_register_solo_event(p_event_id uuid) returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.events e
        where
            e.id = p_event_id
            and e.event_type = 'solo'
    )
    and public.is_verified_user();

$ $;

-- Restrict execution of the helper.
revoke execute on function public.can_register_solo_event(uuid)
from
    anon;

revoke execute on function public.can_register_solo_event(uuid)
from
    public;

grant execute on function public.can_register_solo_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 46. Solo Event Registration Function
-- ------------------------------------------------------------
-- Registers the current verified user for a solo event.
create
or replace function public.register_solo_event(p_event_id uuid) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_registration_id uuid;

begin if not public.can_register_solo_event(p_event_id) then raise exception 'User cannot register for this solo event';

end if;

insert into
    public.registrations (
        event_id,
        user_id,
        team_id,
        status
    )
values
    (
        p_event_id,
        auth.uid(),
        null,
        'registered'
    ) returning id into v_registration_id;

return v_registration_id;

end;

$ $;

-- Restrict execution of the registration function.
revoke execute on function public.register_solo_event(uuid)
from
    anon;

revoke execute on function public.register_solo_event(uuid)
from
    public;

grant execute on function public.register_solo_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 47. Team Event Registration Validation
-- ------------------------------------------------------------
-- Returns true when the current user can register a team
-- for its event.
create
or replace function public.can_register_team_event(p_team_id uuid) returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.teams t
            join public.events e on e.id = t.event_id
        where
            t.id = p_team_id
            and t.leader_id = auth.uid()
            and t.status = 'registered'
            and e.event_type = 'team'
            and public.is_team_size_valid(t.id)
    )
    and public.is_verified_user();

$ $;

-- Restrict execution of the helper.
revoke execute on function public.can_register_team_event(uuid)
from
    anon;

revoke execute on function public.can_register_team_event(uuid)
from
    public;

grant execute on function public.can_register_team_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 48. Team Event Registration Function
-- ------------------------------------------------------------
-- Registers a registered team for its event.
create
or replace function public.register_team_event(p_team_id uuid) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_event_id uuid;

v_registration_id uuid;

begin if not public.can_register_team_event(p_team_id) then raise exception 'Team cannot be registered for this event';

end if;

select
    event_id into v_event_id
from
    public.teams
where
    id = p_team_id;

insert into
    public.registrations (
        event_id,
        user_id,
        team_id,
        status
    )
values
    (
        v_event_id,
        null,
        p_team_id,
        'registered'
    ) returning id into v_registration_id;

return v_registration_id;

end;

$ $;

-- Restrict execution of the registration function.
revoke execute on function public.register_team_event(uuid)
from
    anon;

revoke execute on function public.register_team_event(uuid)
from
    public;

grant execute on function public.register_team_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 49. Restrict Direct Registration Inserts
-- ------------------------------------------------------------
-- Prevent authenticated users from directly inserting
-- registration records.
drop policy if exists "Verified users can create registrations" on public.registrations;

-- ------------------------------------------------------------
-- 50. Restrict Direct Team Inserts
-- ------------------------------------------------------------
-- Prevent authenticated users from directly creating teams.
drop policy if exists "Verified users can create teams" on public.teams;

-- ------------------------------------------------------------
-- 51. Team Creation Function
-- ------------------------------------------------------------
-- Creates a new team for a team event.
create
or replace function public.create_team(
    p_event_id uuid,
    p_team_name text,
    p_team_code text
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

begin -- User must have verified payment.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Event must exist and be a team event.
if not exists (
    select
        1
    from
        public.events
    where
        id = p_event_id
        and event_type = 'team'
) then raise exception 'Invalid team event';

end if;

-- Team name must be provided.
if trim(p_team_name) = '' then raise exception 'Team name cannot be empty';

end if;

-- Team code must be provided.
if trim(p_team_code) = '' then raise exception 'Team code cannot be empty';

end if;

-- Create the team.
insert into
    public.teams (
        event_id,
        team_name,
        team_code,
        leader_id,
        status
    )
values
    (
        p_event_id,
        trim(p_team_name),
        trim(p_team_code),
        auth.uid(),
        'forming'
    ) returning id into v_team_id;

-- Add the leader as the first team member.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

-- Restrict execution of the team creation function.
revoke execute on function public.create_team(uuid, text, text)
from
    anon;

revoke execute on function public.create_team(uuid, text, text)
from
    public;

grant execute on function public.create_team(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 52. Team Join Function
-- ------------------------------------------------------------
-- Allows a verified user to join an existing team using
-- the team's unique code.
create
or replace function public.join_team(p_team_code text) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

v_member_count integer;

begin -- User must have verified payment.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Team code must be provided.
if trim(p_team_code) = '' then raise exception 'Team code cannot be empty';

end if;

-- Find an active/forming team using the supplied code.
select
    id into v_team_id
from
    public.teams
where
    team_code = trim(p_team_code)
    and status = 'forming';

if v_team_id is null then raise exception 'Invalid or unavailable team code';

end if;

-- Check current team size.
select
    count(*) into v_member_count
from
    public.team_members
where
    team_id = v_team_id;

if v_member_count >= 5 then raise exception 'Team is already full';

end if;

-- Add the current user to the team.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

-- Restrict execution of the team join function.
revoke execute on function public.join_team(text)
from
    anon;

revoke execute on function public.join_team(text)
from
    public;

grant execute on function public.join_team(text) to authenticated;

-- ------------------------------------------------------------
-- 53. Prevent Duplicate Team Event Registration
-- ------------------------------------------------------------
-- Ensure a team cannot register for the same event more than once.
create
or replace function public.register_team_event(p_team_id uuid) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_event_id uuid;

v_registration_id uuid;

begin if not public.can_register_team_event(p_team_id) then raise exception 'Team cannot be registered for this event';

end if;

select
    event_id into v_event_id
from
    public.teams
where
    id = p_team_id;

if exists (
    select
        1
    from
        public.registrations
    where
        event_id = v_event_id
        and team_id = p_team_id
        and status = 'registered'
) then raise exception 'Team is already registered for this event';

end if;

insert into
    public.registrations (
        event_id,
        user_id,
        team_id,
        status
    )
values
    (
        v_event_id,
        null,
        p_team_id,
        'registered'
    ) returning id into v_registration_id;

return v_registration_id;

end;

$ $;

-- Keep execution restricted to authenticated users.
revoke execute on function public.register_team_event(uuid)
from
    anon;

revoke execute on function public.register_team_event(uuid)
from
    public;

grant execute on function public.register_team_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 54. Prevent Duplicate Solo Event Registration
-- ------------------------------------------------------------
-- Ensure a user cannot register for the same solo event twice.
create
or replace function public.register_solo_event(p_event_id uuid) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_registration_id uuid;

begin if not public.can_register_solo_event(p_event_id) then raise exception 'User cannot register for this solo event';

end if;

if exists (
    select
        1
    from
        public.registrations
    where
        event_id = p_event_id
        and user_id = auth.uid()
        and status = 'registered'
) then raise exception 'User is already registered for this event';

end if;

insert into
    public.registrations (
        event_id,
        user_id,
        team_id,
        status
    )
values
    (
        p_event_id,
        auth.uid(),
        null,
        'registered'
    ) returning id into v_registration_id;

return v_registration_id;

end;

$ $;

-- Keep execution restricted to authenticated users.
revoke execute on function public.register_solo_event(uuid)
from
    anon;

revoke execute on function public.register_solo_event(uuid)
from
    public;

grant execute on function public.register_solo_event(uuid) to authenticated;

-- ------------------------------------------------------------
-- 55. Team Creation Duplicate Validation
-- ------------------------------------------------------------
-- Improve team creation validation for duplicate team names.
create
or replace function public.create_team(
    p_event_id uuid,
    p_team_name text,
    p_team_code text
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

begin -- User must have verified payment.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Event must exist and be a team event.
if not exists (
    select
        1
    from
        public.events
    where
        id = p_event_id
        and event_type = 'team'
) then raise exception 'Invalid team event';

end if;

-- Team name must be provided.
if trim(p_team_name) = '' then raise exception 'Team name cannot be empty';

end if;

-- Team code must be provided.
if trim(p_team_code) = '' then raise exception 'Team code cannot be empty';

end if;

-- Prevent duplicate team name within the same event.
if exists (
    select
        1
    from
        public.teams
    where
        event_id = p_event_id
        and team_name = trim(p_team_name)
) then raise exception 'A team with this name already exists for this event';

end if;

-- Create the team.
insert into
    public.teams (
        event_id,
        team_name,
        team_code,
        leader_id,
        status
    )
values
    (
        p_event_id,
        trim(p_team_name),
        trim(p_team_code),
        auth.uid(),
        'forming'
    ) returning id into v_team_id;

-- Add the leader as the first team member.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

-- Keep execution restricted to authenticated users.
revoke execute on function public.create_team(uuid, text, text)
from
    anon;

revoke execute on function public.create_team(uuid, text, text)
from
    public;

grant execute on function public.create_team(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 56. Team Code Generator
-- ------------------------------------------------------------
-- Generates a random 8-character team code.
create
or replace function public.generate_team_code() returns text language plpgsql security definer
set
    search_path = public as $ $ declare v_code text;

begin loop v_code := upper(
    substr(
        md5(random() :: text || clock_timestamp() :: text),
        1,
        8
    )
);

exit
when not exists (
    select
        1
    from
        public.teams
    where
        team_code = v_code
);

end loop;

return v_code;

end;

$ $;

-- Restrict direct execution.
revoke execute on function public.generate_team_code()
from
    anon;

revoke execute on function public.generate_team_code()
from
    public;

grant execute on function public.generate_team_code() to authenticated;

-- ------------------------------------------------------------
-- 57. Secure Team Creation With Generated Code
-- ------------------------------------------------------------
create
or replace function public.create_team(p_event_id uuid, p_team_name text) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

v_team_code text;

begin -- User must have verified payment.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Event must exist and be a team event.
if not exists (
    select
        1
    from
        public.events
    where
        id = p_event_id
        and event_type = 'team'
) then raise exception 'Invalid team event';

end if;

-- Team name must be provided.
if trim(p_team_name) = '' then raise exception 'Team name cannot be empty';

end if;

-- Generate the team code on the server.
v_team_code := public.generate_team_code();

-- Prevent duplicate team name within the same event.
if exists (
    select
        1
    from
        public.teams
    where
        event_id = p_event_id
        and team_name = trim(p_team_name)
) then raise exception 'A team with this name already exists for this event';

end if;

-- Create the team.
insert into
    public.teams (
        event_id,
        team_name,
        team_code,
        leader_id,
        status
    )
values
    (
        p_event_id,
        trim(p_team_name),
        v_team_code,
        auth.uid(),
        'forming'
    ) returning id into v_team_id;

-- Add the leader as the first team member.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

-- Restrict execution of the new function signature.
revoke execute on function public.create_team(uuid, text)
from
    anon;

revoke execute on function public.create_team(uuid, text)
from
    public;

grant execute on function public.create_team(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 58. Team Join Duplicate Membership Validation
-- ------------------------------------------------------------
create
or replace function public.join_team(p_team_code text) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

v_member_count integer;

begin -- User must have verified payment.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Team code must be provided.
if trim(p_team_code) = '' then raise exception 'Team code cannot be empty';

end if;

-- Find a forming team using the supplied code.
select
    id into v_team_id
from
    public.teams
where
    team_code = trim(p_team_code)
    and status = 'forming';

if v_team_id is null then raise exception 'Invalid or unavailable team code';

end if;

-- User cannot join the same team twice.
if exists (
    select
        1
    from
        public.team_members
    where
        team_id = v_team_id
        and user_id = auth.uid()
) then raise exception 'User is already a member of this team';

end if;

-- Check current team size.
select
    count(*) into v_member_count
from
    public.team_members
where
    team_id = v_team_id;

if v_member_count >= 5 then raise exception 'Team is already full';

end if;

-- Add the current user to the team.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

-- Keep execution restricted to authenticated users.
revoke execute on function public.join_team(text)
from
    anon;

revoke execute on function public.join_team(text)
from
    public;

grant execute on function public.join_team(text) to authenticated;

-- ------------------------------------------------------------
-- 59. Restrict Direct Team Membership Inserts
-- ------------------------------------------------------------
-- Prevent authenticated users from directly inserting
-- team membership records.
drop policy if exists "Verified users can join teams" on public.team_members;

-- ------------------------------------------------------------
-- 60. Remove Obsolete Team Creation Function
-- ------------------------------------------------------------
-- The old 3-argument function is no longer used.
-- Team creation now uses create_team(event_id, team_name),
-- which generates the team code securely on the server.
drop function if exists public.create_team(uuid, text, text);

-- ------------------------------------------------------------
-- 61. Restrict Direct Team Updates
-- ------------------------------------------------------------
-- Team changes must go through controlled backend functions.
-- Prevent team leaders from directly modifying team records.
drop policy if exists "Team leaders can update own teams" on public.teams;

-- ------------------------------------------------------------
-- 62. Restrict Direct Team Deletion
-- ------------------------------------------------------------
-- Team deletion must go through controlled backend logic.
-- Prevent team leaders from directly deleting team records.
drop policy if exists "Team leaders can delete own teams" on public.teams;

-- ------------------------------------------------------------
-- 63. Restrict Direct Team Membership Deletion
-- ------------------------------------------------------------
-- Team membership changes must go through controlled backend logic.
-- Prevent users from directly removing themselves from teams.
drop policy if exists "Users can leave own team" on public.team_members;

-- ------------------------------------------------------------
-- 64. Restrict Direct Registration Updates
-- ------------------------------------------------------------
-- Registration changes must go through controlled backend logic.
-- Prevent users from directly modifying registration records.
drop policy if exists "Users can update own registrations" on public.registrations;

-- ------------------------------------------------------------
-- 65. Require Verification for Team Confirmation
-- ------------------------------------------------------------
-- A team leader must still have verified payment
-- when confirming/registering the team.
create
or replace function public.can_register_team(p_team_id uuid) returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.teams t
        where
            t.id = p_team_id
            and t.leader_id = auth.uid()
            and t.status = 'forming'
            and public.is_verified_user()
            and public.is_team_size_valid(t.id)
    );

$ $;

revoke execute on function public.can_register_team(uuid)
from
    anon;

revoke execute on function public.can_register_team(uuid)
from
    public;

grant execute on function public.can_register_team(uuid) to authenticated;

-- ------------------------------------------------------------
-- 66. Public Leaderboard Visibility
-- ------------------------------------------------------------
-- Public leaderboard data is available only after
-- an admin publishes the leaderboard.
create
or replace view public.public_leaderboard with (security_invoker = true) as
select
    *
from
    public.individual_leaderboard
where
    exists (
        select
            1
        from
            public.leaderboard_settings
        where
            id = 1
            and is_public = true
    );

-- ------------------------------------------------------------
-- 67. Public Leaderboard Access
-- ------------------------------------------------------------
-- Remove default access.
revoke all on public.public_leaderboard
from
    anon;

revoke all on public.public_leaderboard
from
    authenticated;

-- Allow public visitors and logged-in users to read the
-- leaderboard only when is_public = true.
grant
select
    on public.public_leaderboard to anon;

grant
select
    on public.public_leaderboard to authenticated;

-- ------------------------------------------------------------
-- 68. Restrict Direct Leaderboard Source Access
-- ------------------------------------------------------------
-- The raw leaderboard view should not be directly exposed.
-- Public access should happen through public_leaderboard only.
revoke all on public.individual_leaderboard
from
    anon;

revoke all on public.individual_leaderboard
from
    authenticated;

-- ------------------------------------------------------------
-- 69. Restrict Direct Payment Record Writes
-- ------------------------------------------------------------
-- Payment records must be created or changed only through
-- controlled admin/backend workflows.
-- Authenticated participants must not write payment records directly.
revoke
insert
,
update
,
    delete on public.payment_records
from
    authenticated;

-- ------------------------------------------------------------
-- 70. Controlled Verification Code Issuing
-- ------------------------------------------------------------
-- Issues a verification code for a verified payment.
-- If p_custom_code is NULL or empty, a code is generated.
-- Otherwise, the admin-provided custom code is used.
create
or replace function public.issue_verification_code(
    p_user_id uuid,
    p_payment_id uuid,
    p_custom_code text default null
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_code text;

v_code_id uuid;

begin -- Only admins can issue verification codes.
if not public.is_admin() then raise exception 'Only admins can issue verification codes';

end if;

-- Payment must belong to the specified user and be verified.
if not exists (
    select
        1
    from
        public.payment_records
    where
        id = p_payment_id
        and user_id = p_user_id
        and status = 'verified'
) then raise exception 'Verified payment not found for this user';

end if;

-- Prevent multiple active/issued codes for the same user.
if exists (
    select
        1
    from
        public.verification_codes
    where
        user_id = p_user_id
        and status = 'issued'
) then raise exception 'User already has an issued verification code';

end if;

-- Use admin-provided code when supplied.
if p_custom_code is not null
and length(trim(p_custom_code)) > 0 then v_code := upper(trim(p_custom_code));

else -- Generate a code automatically.
v_code := upper(
    substr(
        md5(random() :: text || clock_timestamp() :: text),
        1,
        8
    )
);

end if;

-- Verification codes must be unique.
if exists (
    select
        1
    from
        public.verification_codes
    where
        code = v_code
) then raise exception 'Verification code already exists';

end if;

insert into
    public.verification_codes (
        user_id,
        payment_id,
        code,
        status
    )
values
    (
        p_user_id,
        p_payment_id,
        v_code,
        'issued'
    ) returning id into v_code_id;

return v_code_id;

end;

$ $;

revoke execute on function public.issue_verification_code(uuid, uuid, text)
from
    anon;

revoke execute on function public.issue_verification_code(uuid, uuid, text)
from
    public;

grant execute on function public.issue_verification_code(uuid, uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 71. Restrict Direct Verification Code Reads
-- ------------------------------------------------------------
-- Verification codes are sensitive and should not be directly
-- readable by participants.
drop policy if exists "Users can view own verification codes" on public.verification_codes;

-- ------------------------------------------------------------
-- 72. Verify Participant Verification Code
-- ------------------------------------------------------------
-- Allows a participant to submit the verification code
-- received from the admin.
create
or replace function public.verify_participant_code(p_code text) returns boolean language plpgsql security definer
set
    search_path = public as $ $ declare v_code_id uuid;

begin -- Code must not be empty.
if p_code is null
or length(trim(p_code)) = 0 then raise exception 'Verification code is required';

end if;

-- Find an issued code belonging to the current user.
select
    vc.id into v_code_id
from
    public.verification_codes vc
where
    vc.user_id = auth.uid()
    and vc.code = upper(trim(p_code))
    and vc.status = 'issued'
limit
    1;

if v_code_id is null then raise exception 'Invalid or already used verification code';

end if;

-- Mark the code as used.
update
    public.verification_codes
set
    status = 'used',
    used_at = now()
where
    id = v_code_id;

return true;

end;

$ $;

revoke execute on function public.verify_participant_code(text)
from
    anon;

revoke execute on function public.verify_participant_code(text)
from
    public;

grant execute on function public.verify_participant_code(text) to authenticated;

-- ------------------------------------------------------------
-- 73. Require Code Verification for User Eligibility
-- ------------------------------------------------------------
-- A participant is considered verified only when:
-- 1. Their payment is verified.
-- 2. Their issued verification code has been successfully used.
create
or replace function public.is_verified_user() returns boolean language sql security definer
set
    search_path = public stable as $ $
select
    exists (
        select
            1
        from
            public.payment_records p
            join public.verification_codes vc on vc.payment_id = p.id
            and vc.user_id = p.user_id
        where
            p.user_id = auth.uid()
            and p.status = 'verified'
            and vc.status = 'used'
    );

$ $;

revoke execute on function public.is_verified_user()
from
    anon;

revoke execute on function public.is_verified_user()
from
    public;

grant execute on function public.is_verified_user() to authenticated;

-- ------------------------------------------------------------
-- 74. Restrict Direct Payment Admin Writes
-- ------------------------------------------------------------
-- Payment changes must go through controlled backend functions.
drop policy if exists "Admins can create payment records" on public.payment_records;

drop policy if exists "Admins can update payment records" on public.payment_records;

drop policy if exists "Admins can delete payment records" on public.payment_records;

-- ------------------------------------------------------------
-- 75. Admin Offline Payment Verification
-- ------------------------------------------------------------
-- Creates and verifies an offline payment for a participant.
-- The payment amount is taken from fest_settings.
-- A verification code can then be issued separately using
-- issue_verification_code().
create
or replace function public.verify_offline_payment(
    p_user_id uuid,
    p_payment_reference text default null
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_payment_id uuid;

v_fest_fee numeric(10, 2);

begin -- Only admins can verify offline payments.
if not public.is_admin() then raise exception 'Only admins can verify offline payments';

end if;

-- Get the configured fest fee.
select
    fest_fee into v_fest_fee
from
    public.fest_settings
where
    id = 1;

-- The fest fee must be configured before payment verification.
if v_fest_fee is null
or v_fest_fee <= 0 then raise exception 'Fest fee is not configured';

end if;

-- The participant must have a profile.
if not exists (
    select
        1
    from
        public.profiles
    where
        id = p_user_id
) then raise exception 'Participant profile not found';

end if;

-- Prevent multiple verified payments for the same participant.
if exists (
    select
        1
    from
        public.payment_records
    where
        user_id = p_user_id
        and status = 'verified'
) then raise exception 'Participant already has a verified payment';

end if;

-- Create the verified offline payment.
insert into
    public.payment_records (
        user_id,
        amount,
        payment_method,
        status,
        payment_reference,
        verified_by,
        verified_at
    )
values
    (
        p_user_id,
        v_fest_fee,
        'offline',
        'verified',
        nullif(trim(p_payment_reference), ''),
        auth.uid(),
        now()
    ) returning id into v_payment_id;

return v_payment_id;

end;

$ $;

revoke execute on function public.verify_offline_payment(uuid, text)
from
    anon;

revoke execute on function public.verify_offline_payment(uuid, text)
from
    public;

grant execute on function public.verify_offline_payment(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 76. Audit Offline Payment Verification
-- ------------------------------------------------------------
-- Record every successful offline payment verification
-- for administrative accountability.
create
or replace function public.verify_offline_payment(
    p_user_id uuid,
    p_payment_reference text default null
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_payment_id uuid;

v_fest_fee numeric(10, 2);

begin -- Only admins can verify offline payments.
if not public.is_admin() then raise exception 'Only admins can verify offline payments';

end if;

-- Get the configured fest fee.
select
    fest_fee into v_fest_fee
from
    public.fest_settings
where
    id = 1;

if v_fest_fee is null
or v_fest_fee <= 0 then raise exception 'Fest fee is not configured';

end if;

-- The participant must have a profile.
if not exists (
    select
        1
    from
        public.profiles
    where
        id = p_user_id
) then raise exception 'Participant profile not found';

end if;

-- Prevent multiple verified payments for the same participant.
if exists (
    select
        1
    from
        public.payment_records
    where
        user_id = p_user_id
        and status = 'verified'
) then raise exception 'Participant already has a verified payment';

end if;

-- Create the verified offline payment.
insert into
    public.payment_records (
        user_id,
        amount,
        payment_method,
        status,
        payment_reference,
        verified_by,
        verified_at
    )
values
    (
        p_user_id,
        v_fest_fee,
        'offline',
        'verified',
        nullif(trim(p_payment_reference), ''),
        auth.uid(),
        now()
    ) returning id into v_payment_id;

-- Record the administrative action.
insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'VERIFY_OFFLINE_PAYMENT',
        'payment',
        v_payment_id,
        jsonb_build_object(
            'user_id',
            p_user_id,
            'amount',
            v_fest_fee,
            'payment_method',
            'offline',
            'payment_reference',
            nullif(trim(p_payment_reference), '')
        )
    );

return v_payment_id;

end;

$ $;

revoke execute on function public.verify_offline_payment(uuid, text)
from
    anon;

revoke execute on function public.verify_offline_payment(uuid, text)
from
    public;

grant execute on function public.verify_offline_payment(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 77. Audit Verification Code Issuing
-- ------------------------------------------------------------
-- Record verification-code issuance without storing
-- the actual sensitive verification code.
create
or replace function public.issue_verification_code(
    p_user_id uuid,
    p_payment_id uuid,
    p_custom_code text default null
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_code text;

v_code_id uuid;

v_is_custom boolean;

begin -- Only admins can issue verification codes.
if not public.is_admin() then raise exception 'Only admins can issue verification codes';

end if;

-- Payment must belong to the specified user and be verified.
if not exists (
    select
        1
    from
        public.payment_records
    where
        id = p_payment_id
        and user_id = p_user_id
        and status = 'verified'
) then raise exception 'Verified payment not found for this user';

end if;

-- Prevent multiple active/issued codes for the same user.
if exists (
    select
        1
    from
        public.verification_codes
    where
        user_id = p_user_id
        and status = 'issued'
) then raise exception 'User already has an issued verification code';

end if;

v_is_custom := p_custom_code is not null
and length(trim(p_custom_code)) > 0;

if v_is_custom then v_code := upper(trim(p_custom_code));

else v_code := upper(
    substr(
        md5(random() :: text || clock_timestamp() :: text),
        1,
        8
    )
);

end if;

-- Verification codes must be unique.
if exists (
    select
        1
    from
        public.verification_codes
    where
        code = v_code
) then raise exception 'Verification code already exists';

end if;

insert into
    public.verification_codes (
        user_id,
        payment_id,
        code,
        status
    )
values
    (
        p_user_id,
        p_payment_id,
        v_code,
        'issued'
    ) returning id into v_code_id;

-- Audit the issuance without storing the actual code.
insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'ISSUE_VERIFICATION_CODE',
        'verification_code',
        v_code_id,
        jsonb_build_object(
            'user_id',
            p_user_id,
            'payment_id',
            p_payment_id,
            'custom_code',
            v_is_custom
        )
    );

return v_code_id;

end;

$ $;

revoke execute on function public.issue_verification_code(uuid, uuid, text)
from
    anon;

revoke execute on function public.issue_verification_code(uuid, uuid, text)
from
    public;

grant execute on function public.issue_verification_code(uuid, uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 78. Audit Participant Code Verification
-- ------------------------------------------------------------
-- Record successful participant verification without storing
-- the actual verification code.
create
or replace function public.verify_participant_code(p_code text) returns boolean language plpgsql security definer
set
    search_path = public as $ $ declare v_code_id uuid;

begin if auth.uid() is null then raise exception 'Authentication required';

end if;

if p_code is null
or length(trim(p_code)) = 0 then raise exception 'Verification code is required';

end if;

-- Lock the matching issued code against concurrent use.
select
    vc.id into v_code_id
from
    public.verification_codes vc
where
    vc.user_id = auth.uid()
    and vc.code = upper(trim(p_code))
    and vc.status = 'issued'
limit
    1 for
update
;

if v_code_id is null then raise exception 'Invalid or already used verification code';

end if;

update
    public.verification_codes
set
    status = 'used',
    used_at = now()
where
    id = v_code_id;

-- Do not insert a participant action into admin-only audit_logs.
return true;

end;

$ $;

revoke execute on function public.verify_participant_code(text)
from
    anon;

revoke execute on function public.verify_participant_code(text)
from
    public;

grant execute on function public.verify_participant_code(text) to authenticated;

-- ------------------------------------------------------------
-- 79. Protect Audit Logs from Modification
-- ------------------------------------------------------------
-- Audit records should be append-only.
-- Admins can view and create audit records,
-- but existing records cannot be modified or deleted.
drop policy if exists "Admins can update audit logs" on public.audit_logs;

drop policy if exists "Admins can delete audit logs" on public.audit_logs;

-- ------------------------------------------------------------
-- 80. Restrict Direct Verification Code Changes
-- ------------------------------------------------------------
-- Verification codes must be changed through controlled
-- backend functions rather than direct table updates.
drop policy if exists "Admins can update verification codes" on public.verification_codes;

drop policy if exists "Admins can delete verification codes" on public.verification_codes;

-- ------------------------------------------------------------
-- 81. Restrict Audit Log Table Privileges
-- ------------------------------------------------------------
-- Audit logs are append-only for authenticated users.
revoke
update
,
    delete on public.audit_logs
from
    authenticated;

-- ------------------------------------------------------------
-- 82. Restrict Verification Code Table Privileges
-- ------------------------------------------------------------
-- Verification codes can only be changed through controlled
-- backend functions.
revoke
insert
,
update
,
    delete on public.verification_codes
from
    authenticated;

-- ------------------------------------------------------------
-- 83. Restrict Payment Table Privileges
-- ------------------------------------------------------------
-- Payment records can only be changed through controlled
-- backend functions.
revoke
insert
,
update
,
    delete on public.payment_records
from
    authenticated;

-- ------------------------------------------------------------
-- 84. Restrict Direct Registration Writes
-- ------------------------------------------------------------
-- Registrations must be created or changed through controlled
-- backend functions.
revoke
insert
,
update
,
    delete on public.registrations
from
    authenticated;

-- ------------------------------------------------------------
-- 85. Restrict Direct Team Membership Writes
-- ------------------------------------------------------------
-- Team membership changes must go through controlled
-- backend functions.
revoke
insert
,
update
,
    delete on public.team_members
from
    authenticated;

-- ------------------------------------------------------------
-- 86. Restrict Direct Team Writes
-- ------------------------------------------------------------
-- Team creation and changes must go through controlled
-- backend functions.
revoke
insert
,
update
,
    delete on public.teams
from
    authenticated;

-- ------------------------------------------------------------
-- 87. Restrict Direct Result Writes
-- ------------------------------------------------------------
-- Result records must be created or changed through controlled
-- admin/backend functions.
revoke
insert
,
update
,
    delete on public.results
from
    authenticated;

-- ------------------------------------------------------------
-- 88. Restrict Direct Attendance Writes
-- ------------------------------------------------------------
-- Attendance records must be created or changed through
-- controlled admin/backend functions.
revoke
insert
,
update
,
    delete on public.attendance
from
    authenticated;

-- ------------------------------------------------------------
-- 89. Controlled Admin Result Declaration
-- ------------------------------------------------------------
-- Allows an admin to declare a result for either:
-- an individual participant or a team.
create
or replace function public.declare_result(
    p_event_id uuid,
    p_user_id uuid default null,
    p_team_id uuid default null,
    p_position smallint default null
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_result_id uuid;

v_event_type text;

begin -- Only admins can declare results.
if not public.is_admin() then raise exception 'Only admins can declare results';

end if;

-- Position must be 1st, 2nd, or 3rd.
if p_position is null
or p_position not between 1
and 3 then raise exception 'Position must be between 1 and 3';

end if;

-- Exactly one result target must be supplied.
if (
    p_user_id is null
    and p_team_id is null
)
or (
    p_user_id is not null
    and p_team_id is not null
) then raise exception 'Specify either a user or a team, not both';

end if;

-- Get the event type.
select
    event_type into v_event_type
from
    public.events
where
    id = p_event_id;

if v_event_type is null then raise exception 'Event not found';

end if;

-- Solo events must have an individual result.
if v_event_type = 'solo'
and p_user_id is null then raise exception 'Solo events require an individual result';

end if;

-- Team events must have a team result.
if v_event_type = 'team'
and p_team_id is null then raise exception 'Team events require a team result';

end if;

-- Ensure the selected team belongs to this event.
if p_team_id is not null
and not exists (
    select
        1
    from
        public.teams
    where
        id = p_team_id
        and event_id = p_event_id
) then raise exception 'Team does not belong to this event';

end if;

-- Ensure the selected participant has registered for this event.
if p_user_id is not null
and not exists (
    select
        1
    from
        public.registrations
    where
        event_id = p_event_id
        and user_id = p_user_id
        and status = 'registered'
) then raise exception 'Participant is not registered for this event';

end if;

-- Ensure the selected team has registered for this event.
if p_team_id is not null
and not exists (
    select
        1
    from
        public.registrations
    where
        event_id = p_event_id
        and team_id = p_team_id
        and status = 'registered'
) then raise exception 'Team is not registered for this event';

end if;

-- The table already prevents duplicate positions.
insert into
    public.results (
        event_id,
        user_id,
        team_id,
        position,
        declared_by
    )
values
    (
        p_event_id,
        p_user_id,
        p_team_id,
        p_position,
        auth.uid()
    ) returning id into v_result_id;

-- Audit the result declaration.
insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'DECLARE_RESULT',
        'result',
        v_result_id,
        jsonb_build_object(
            'event_id',
            p_event_id,
            'user_id',
            p_user_id,
            'team_id',
            p_team_id,
            'position',
            p_position
        )
    );

return v_result_id;

end;

$ $;

revoke execute on function public.declare_result(uuid, uuid, uuid, smallint)
from
    anon;

revoke execute on function public.declare_result(uuid, uuid, uuid, smallint)
from
    public;

grant execute on function public.declare_result(uuid, uuid, uuid, smallint) to authenticated;

-- ------------------------------------------------------------
-- 90. Controlled Admin Attendance
-- ------------------------------------------------------------
-- Allows an admin to mark attendance for either:
-- an individual participant or a team.
create
or replace function public.mark_attendance(
    p_event_id uuid,
    p_user_id uuid default null,
    p_team_id uuid default null,
    p_status text default 'present'
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_attendance_id uuid;

v_event_type text;

begin -- Only admins can mark attendance.
if not public.is_admin() then raise exception 'Only admins can mark attendance';

end if;

-- Status must be present or absent.
if p_status not in ('present', 'absent') then raise exception 'Attendance status must be present or absent';

end if;

-- Exactly one attendance target must be supplied.
if (
    p_user_id is null
    and p_team_id is null
)
or (
    p_user_id is not null
    and p_team_id is not null
) then raise exception 'Specify either a user or a team, not both';

end if;

-- Get the event type.
select
    event_type into v_event_type
from
    public.events
where
    id = p_event_id;

if v_event_type is null then raise exception 'Event not found';

end if;

-- Solo events require an individual participant.
if v_event_type = 'solo'
and p_user_id is null then raise exception 'Solo events require an individual attendance record';

end if;

-- Team events require a team.
if v_event_type = 'team'
and p_team_id is null then raise exception 'Team events require a team attendance record';

end if;

-- Ensure the participant is registered for this event.
if p_user_id is not null
and not exists (
    select
        1
    from
        public.registrations
    where
        event_id = p_event_id
        and user_id = p_user_id
        and status = 'registered'
) then raise exception 'Participant is not registered for this event';

end if;

-- Ensure the team belongs to this event.
if p_team_id is not null
and not exists (
    select
        1
    from
        public.teams
    where
        id = p_team_id
        and event_id = p_event_id
) then raise exception 'Team does not belong to this event';

end if;

-- Ensure the team is registered for this event.
if p_team_id is not null
and not exists (
    select
        1
    from
        public.registrations
    where
        event_id = p_event_id
        and team_id = p_team_id
        and status = 'registered'
) then raise exception 'Team is not registered for this event';

end if;

-- Update existing attendance if already marked.
if p_user_id is not null then
update
    public.attendance
set
    status = p_status,
    marked_at = now(),
    marked_by = auth.uid()
where
    event_id = p_event_id
    and user_id = p_user_id returning id into v_attendance_id;

else
update
    public.attendance
set
    status = p_status,
    marked_at = now(),
    marked_by = auth.uid()
where
    event_id = p_event_id
    and team_id = p_team_id returning id into v_attendance_id;

end if;

-- If no attendance record exists, create one.
if v_attendance_id is null then
insert into
    public.attendance (
        event_id,
        user_id,
        team_id,
        status,
        marked_by
    )
values
    (
        p_event_id,
        p_user_id,
        p_team_id,
        p_status,
        auth.uid()
    ) returning id into v_attendance_id;

end if;

-- Audit the attendance action.
insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'MARK_ATTENDANCE',
        'attendance',
        v_attendance_id,
        jsonb_build_object(
            'event_id',
            p_event_id,
            'user_id',
            p_user_id,
            'team_id',
            p_team_id,
            'status',
            p_status
        )
    );

return v_attendance_id;

end;

$ $;

revoke execute on function public.mark_attendance(uuid, uuid, uuid, text)
from
    anon;

revoke execute on function public.mark_attendance(uuid, uuid, uuid, text)
from
    public;

grant execute on function public.mark_attendance(uuid, uuid, uuid, text) to authenticated;

-- ============================================================
-- STEP 91: EVENT FILES STORAGE
-- ============================================================
-- Create a private bucket for event-related files such as PDFs.
insert into
    storage.buckets (id, name, public)
values
    (
        'event-files',
        'event-files',
        false
    ) on conflict (id) do nothing;

-- Authenticated users can view/download event files.
create policy "Authenticated users can read event files" on storage.objects for
select
    to authenticated using (bucket_id = 'event-files');

-- Only admins can upload event files.
create policy "Admins can upload event files" on storage.objects for
insert
    to authenticated with check (
        bucket_id = 'event-files'
        and public.is_admin()
    );

-- Only admins can update event files.
create policy "Admins can update event files" on storage.objects for
update
    to authenticated using (
        bucket_id = 'event-files'
        and public.is_admin()
    ) with check (
        bucket_id = 'event-files'
        and public.is_admin()
    );

-- Only admins can delete event files.
create policy "Admins can delete event files" on storage.objects for delete to authenticated using (
    bucket_id = 'event-files'
    and public.is_admin()
);

-- ============================================================
-- STEP 92: CONTROLLED LEADERBOARD PUBLISH FUNCTION
-- ============================================================
create
or replace function public.set_leaderboard_visibility(p_is_public boolean) returns boolean language plpgsql security definer
set
    search_path = public as $ $ begin -- Only active admins can publish or unpublish the leaderboard.
    if not public.is_admin() then raise exception 'Only admins can change leaderboard visibility';

end if;

update
    public.leaderboard_settings
set
    is_public = p_is_public,
    published_at = case
        when p_is_public then now()
        else null
    end,
    updated_at = now(),
    updated_by = auth.uid()
where
    id = 1;

if not found then raise exception 'Leaderboard settings not found';

end if;

-- Record the action in the audit log.
insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        case
            when p_is_public then 'PUBLISH_LEADERBOARD'
            else 'UNPUBLISH_LEADERBOARD'
        end,
        'leaderboard',
        '00000000-0000-0000-0000-000000000001',
        jsonb_build_object('is_public', p_is_public)
    );

return true;

end;

$ $;

revoke execute on function public.set_leaderboard_visibility(boolean)
from
    anon;

revoke execute on function public.set_leaderboard_visibility(boolean)
from
    public;

grant execute on function public.set_leaderboard_visibility(boolean) to authenticated;

-- ============================================================
-- STEP 93: ADMIN MANAGEMENT FUNCTIONS
-- ============================================================
-- Add a new admin.
create
or replace function public.create_admin(
    p_user_id uuid,
    p_role text default 'ADMIN'
) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_admin_id uuid;

begin if not public.is_super_admin() then raise exception 'Only super admins can create admins';

end if;

if p_role not in ('ADMIN', 'SUPER_ADMIN') then raise exception 'Invalid admin role';

end if;

if not exists (
    select
        1
    from
        auth.users
    where
        id = p_user_id
) then raise exception 'User does not exist';

end if;

if exists (
    select
        1
    from
        public.admin_users
    where
        user_id = p_user_id
) then raise exception 'User is already an admin';

end if;

insert into
    public.admin_users (
        user_id,
        role,
        status,
        created_by
    )
values
    (
        p_user_id,
        p_role,
        'active',
        auth.uid()
    ) returning id into v_admin_id;

insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'CREATE_ADMIN',
        'admin',
        v_admin_id,
        jsonb_build_object(
            'user_id',
            p_user_id,
            'role',
            p_role
        )
    );

return v_admin_id;

end;

$ $;

-- Update an existing admin's role/status.
create
or replace function public.update_admin(
    p_admin_id uuid,
    p_role text,
    p_status text
) returns boolean language plpgsql security definer
set
    search_path = public as $ $ begin if not public.is_super_admin() then raise exception 'Only super admins can update admins';

end if;

if p_role not in ('ADMIN', 'SUPER_ADMIN') then raise exception 'Invalid admin role';

end if;

if p_status not in ('active', 'inactive') then raise exception 'Invalid admin status';

end if;

if not exists (
    select
        1
    from
        public.admin_users
    where
        id = p_admin_id
) then raise exception 'Admin not found';

end if;

update
    public.admin_users
set
    role = p_role,
    status = p_status,
    updated_at = now()
where
    id = p_admin_id;

insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'UPDATE_ADMIN',
        'admin',
        p_admin_id,
        jsonb_build_object(
            'role',
            p_role,
            'status',
            p_status
        )
    );

return true;

end;

$ $;

-- Remove an admin.
create
or replace function public.delete_admin(p_admin_id uuid) returns boolean language plpgsql security definer
set
    search_path = public as $ $ begin if not public.is_super_admin() then raise exception 'Only super admins can delete admins';

end if;

if not exists (
    select
        1
    from
        public.admin_users
    where
        id = p_admin_id
) then raise exception 'Admin not found';

end if;

if exists (
    select
        1
    from
        public.admin_users
    where
        id = p_admin_id
        and user_id = auth.uid()
) then raise exception 'You cannot delete your own admin account';

end if;

delete from
    public.admin_users
where
    id = p_admin_id;

insert into
    public.audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
values
    (
        auth.uid(),
        'DELETE_ADMIN',
        'admin',
        p_admin_id,
        jsonb_build_object(
            'deleted_admin_id',
            p_admin_id
        )
    );

return true;

end;

$ $;

-- Functions must not be callable by anonymous users.
revoke execute on function public.create_admin(uuid, text)
from
    anon;

revoke execute on function public.create_admin(uuid, text)
from
    public;

revoke execute on function public.update_admin(uuid, text, text)
from
    anon;

revoke execute on function public.update_admin(uuid, text, text)
from
    public;

revoke execute on function public.delete_admin(uuid)
from
    anon;

revoke execute on function public.delete_admin(uuid)
from
    public;

-- Authenticated users may call the functions,
-- but the functions themselves enforce SUPER_ADMIN access.
grant execute on function public.create_admin(uuid, text) to authenticated;

grant execute on function public.update_admin(uuid, text, text) to authenticated;

grant execute on function public.delete_admin(uuid) to authenticated;

-- ============================================================
-- STEP 94: SECURE PUBLIC LEADERBOARD VIEW
-- ============================================================
-- Recreate the public leaderboard as a security-definer view.
-- This allows public visitors to read the leaderboard only
-- through this controlled view.
drop view if exists public.public_leaderboard;

create
or replace view public.public_leaderboard as
select
    user_id,
    full_name,
    college_name,
    total_points
from
    public.individual_leaderboard
where
    exists (
        select
            1
        from
            public.leaderboard_settings
        where
            id = 1
            and is_public = true
    );

-- Public visitors and authenticated users may read the
-- leaderboard through this view.
grant
select
    on public.public_leaderboard to anon;

grant
select
    on public.public_leaderboard to authenticated;

-- Direct access to the underlying leaderboard remains blocked.
revoke all on public.individual_leaderboard
from
    anon;

revoke all on public.individual_leaderboard
from
    authenticated;

-- ============================================================
-- STEP 95: PREVENT DUPLICATE RESULTS
-- ============================================================
-- A participant can receive only one position in a solo event.
create unique index if not exists results_unique_solo_participant on public.results (event_id, user_id)
where
    user_id is not null;

-- A team can receive only one position in a team event.
create unique index if not exists results_unique_team on public.results (event_id, team_id)
where
    team_id is not null;

-- ============================================================
-- STEP 96: PREVENT DUPLICATE REGISTRATIONS
-- ============================================================
-- Active-registration uniqueness is enforced by the indexes
-- defined earlier, which permit re-registration after cancellation.
-- ============================================================
-- STEP 97: PREVENT DUPLICATE ATTENDANCE
-- ============================================================
-- Attendance uniqueness is enforced by the indexes defined
-- earlier in the migration.
-- ============================================================
-- STEP 98: MAKE TEAM JOIN CONCURRENCY-SAFE
-- ============================================================
create
or replace function public.join_team(p_team_code text) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

v_member_count integer;

begin -- User must be verified before joining a team.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Team code must be provided.
if trim(p_team_code) = '' then raise exception 'Team code cannot be empty';

end if;

-- Find a forming team using the supplied code.
select
    id into v_team_id
from
    public.teams
where
    team_code = trim(p_team_code)
    and status = 'forming';

if v_team_id is null then raise exception 'Invalid or unavailable team code';

end if;

-- Lock this specific team until the current transaction finishes.
-- This prevents concurrent joins from exceeding 5 members.
perform pg_advisory_xact_lock(
    hashtextextended(v_team_id :: text, 0)
);

-- Check again after obtaining the lock.
select
    count(*) into v_member_count
from
    public.team_members
where
    team_id = v_team_id;

if v_member_count >= 5 then raise exception 'Team is already full';

end if;

-- User cannot join the same team twice.
if exists (
    select
        1
    from
        public.team_members
    where
        team_id = v_team_id
        and user_id = auth.uid()
) then raise exception 'User is already a member of this team';

end if;

-- Add the current user to the team.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

revoke execute on function public.join_team(text)
from
    anon;

revoke execute on function public.join_team(text)
from
    public;

grant execute on function public.join_team(text) to authenticated;

-- ============================================================
-- STEP 99: RESTRICT DIRECT TEAM CODE GENERATOR ACCESS
-- ============================================================
-- Users should not be able to call the team-code generator
-- directly. Team codes are generated internally by create_team().
revoke execute on function public.generate_team_code()
from
    anon;

revoke execute on function public.generate_team_code()
from
    authenticated;

revoke execute on function public.generate_team_code()
from
    public;

-- ============================================================
-- STEP 100: Prevent concurrent joining of multiple teams
--         for the same event by the same user
-- ============================================================
create
or replace function public.join_team(p_team_code text) returns uuid language plpgsql security definer
set
    search_path = public as $ $ declare v_team_id uuid;

v_event_id uuid;

v_team_status text;

v_member_count integer;

v_existing_membership boolean;

begin -- Require an authenticated user.
if auth.uid() is null then raise exception 'Authentication required';

end if;

-- Reject missing or blank team codes.
if p_team_code is null
or trim(p_team_code) = '' then raise exception 'Team code cannot be empty';

end if;

-- User must be verified first.
if not public.is_verified_user() then raise exception 'User is not verified';

end if;

-- Find the team
select
    t.id,
    t.event_id,
    t.status into v_team_id,
    v_event_id,
    v_team_status
from
    public.teams t
where
    t.team_code = upper(trim(p_team_code));

if v_team_id is null then raise exception 'Invalid team code';

end if;

if v_team_status <> 'forming' then raise exception 'Team is not accepting new members';

end if;

-- Lock this user + event combination for this transaction.
-- This prevents two simultaneous join requests from placing
-- the same user into two teams for the same event.
perform pg_advisory_xact_lock(
    hashtextextended(
        auth.uid() :: text || ':' || v_event_id :: text,
        0
    )
);

-- Check whether the user already belongs to a team
-- for this event.
select
    exists (
        select
            1
        from
            public.team_members tm
            join public.teams t on t.id = tm.team_id
        where
            tm.user_id = auth.uid()
            and t.event_id = v_event_id
    ) into v_existing_membership;

if v_existing_membership then raise exception 'User is already a member of a team for this event';

end if;

-- Lock the target team while checking its size.
perform pg_advisory_xact_lock(
    hashtextextended(v_team_id :: text, 0)
);

-- Registration may have closed the team while this request waited.
if not exists (
    select
        1
    from
        public.teams t
    where
        t.id = v_team_id
        and t.status = 'forming'
) then raise exception 'Team is not accepting new members';

end if;

select
    count(*) into v_member_count
from
    public.team_members
where
    team_id = v_team_id;

if v_member_count >= 5 then raise exception 'Team is already full';

end if;

-- Add the user to the team.
insert into
    public.team_members (team_id, user_id)
values
    (v_team_id, auth.uid());

return v_team_id;

end;

$ $;

revoke execute on function public.join_team(text)
from
    anon;

revoke execute on function public.join_team(text)
from
    public;

grant execute on function public.join_team(text) to authenticated;

-- ============================================================
-- STEP 101: Restrict team-size helper function
-- ============================================================
revoke execute on function public.is_team_size_valid(uuid)
from
    anon;

revoke execute on function public.is_team_size_valid(uuid)
from
    public;

grant execute on function public.is_team_size_valid(uuid) to authenticated;