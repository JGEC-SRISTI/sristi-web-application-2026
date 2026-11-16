begin;

select
  plan(26);

-- All fixtures are local to this transaction and roll back at the end.
insert into
  auth.users (id, email)
values
  (
    'f1000000-0000-4000-8000-000000000001',
    'constraints-user-one@example.invalid'
  ),
  (
    'f1000000-0000-4000-8000-000000000002',
    'constraints-user-two@example.invalid'
  ),
  (
    'f1000000-0000-4000-8000-000000000003',
    'constraints-admin@example.invalid'
  ),
  (
    'f1000000-0000-4000-8000-000000000004',
    'constraints-invalid-year-low@example.invalid'
  ),
  (
    'f1000000-0000-4000-8000-000000000005',
    'constraints-invalid-year-high@example.invalid'
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
    'f1000000-0000-4000-8000-000000000001',
    'Constraint Test User One',
    '9000000001',
    'Test College',
    'CT-001',
    'Testing',
    1
  ),
  (
    'f1000000-0000-4000-8000-000000000002',
    'Constraint Test User Two',
    '9000000002',
    'Test College',
    'CT-002',
    'Testing',
    4
  );

insert into
  public.admin_users (user_id, role, status)
values
  (
    'f1000000-0000-4000-8000-000000000003',
    'ADMIN',
    'active'
  );

insert into
  public.payment_records (user_id, amount, payment_method, status)
values
  (
    'f1000000-0000-4000-8000-000000000001',
    250.00,
    'offline',
    'pending'
  );

-- Restore preexisting singleton data on rollback after constraint checks.
delete from
  public.fest_settings
where
  id = 1;

insert into
  public.fest_settings (id, fest_name, fest_fee)
values
  (1, 'Constraint Test Fest', 250.00);

insert into
  public.events (
    id,
    name,
    slug,
    short_description,
    description,
    event_type,
    category,
    venue,
    min_team_size,
    max_team_size
  )
values
  (
    'f2000000-0000-4000-8000-000000000001',
    'Constraint Solo Event',
    'constraint-solo-event',
    'Short description',
    'Description',
    'solo',
    'Testing',
    'Test Venue',
    null,
    null
  ),
  (
    'f2000000-0000-4000-8000-000000000002',
    'Constraint Team Event',
    'constraint-team-event',
    'Short description',
    'Description',
    'team',
    'Testing',
    'Test Venue',
    3,
    5
  );

insert into
  public.teams (id, event_id, team_name, team_code, leader_id)
values
  (
    'f3000000-0000-4000-8000-000000000001',
    'f2000000-0000-4000-8000-000000000002',
    'Constraint Test Team',
    'CONSTRAINT-TEAM-001',
    'f1000000-0000-4000-8000-000000000001'
  );

select
  lives_ok(
    $$
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
        'f1000000-0000-4000-8000-000000000004',
        'Invalid Year Low',
        '9000000004',
        'Test College',
        'CT-004',
        'Testing',
        0
      ) $$,
      '23514',
       null,
      'profile academic year cannot be below 1'
  );

select
  throws_ok(
    $$
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
        'f1000000-0000-4000-8000-000000000005',
        'Invalid Year High',
        '9000000005',
        'Test College',
        'CT-005',
        'Testing',
        5
      ) $$,
      '23514',
       null,
      'profile academic year cannot exceed 4'
  );

select
  throws_ok(
    $$
    insert into
      public.payment_records (user_id, amount, payment_method, status)
    values
      (
        'f1000000-0000-4000-8000-000000000002',
        0,
        'offline',
        'pending'
      ) $$,
      '23514',
       null,
      'payment amount must be greater than zero'
  );

select
  throws_ok(
    $$
    insert into
      public.payment_records (user_id, amount, payment_method, status)
    values
      (
        'f1000000-0000-4000-8000-000000000002',
        -1,
        'offline',
        'pending'
      ) $$,
      '23514',
       null,
      'negative payment amounts are rejected'
  );

select
  throws_ok(
    $$
    insert into
      public.payment_records (user_id, amount, payment_method, status)
    values
      (
        'f1000000-0000-4000-8000-000000000002',
        250,
        'cash',
        'pending'
      ) $$,
      '23514',
       null,
      'unsupported payment methods are rejected'
  );

select
  throws_ok(
    $$
    insert into
      public.payment_records (user_id, amount, payment_method, status)
    values
      (
        'f1000000-0000-4000-8000-000000000002',
        250,
        'offline',
        'approved'
      ) $$,
      '23514',
       null,
      'unsupported payment statuses are rejected'
  );

select
  throws_ok(
    $$
    insert into
      public.fest_settings (id, fest_name, fest_fee)
    values
      (1, 'Invalid Fee Fest', -1) $$,
      '23514',
       null,
      'fest fee cannot be negative'
  );

select
  throws_ok(
    $$
    insert into
      public.events (
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
        'Invalid Type Event',
        'invalid-type-event',
        'Short',
        'Description',
        'hybrid',
        'Testing',
        'Test Venue'
      ) $$,
      '23514',
       null,
      'event type must be solo or team'
  );

select
  throws_ok(
    $$
    insert into
      public.events (
        name,
        slug,
        short_description,
        description,
        event_type,
        category,
        venue,
        min_team_size,
        max_team_size
      )
    values
      (
        'Solo With Sizes',
        'solo-with-sizes',
        'Short',
        'Description',
        'solo',
        'Testing',
        'Test Venue',
        3,
        5
      ) $$,
      '23514',
       null,
      'solo events cannot specify team sizes'
  );

select
  throws_ok(
    $$
    insert into
      public.events (
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
        'Team Without Sizes',
        'team-without-sizes',
        'Short',
        'Description',
        'team',
        'Testing',
        'Test Venue'
      ) $$,
      '23514',
       null,
      'team events must specify the required team sizes'
  );

select
  lives_ok(
    $$
    insert into
      public.events (
        name,
        slug,
        short_description,
        description,
        event_type,
        category,
        venue,
        min_team_size,
        max_team_size
      )
    values
      (
        'Team Configurable Minimum',
        'team-configurable-minimum',
        'Short',
        'Description',
        'team',
        'Testing',
        'Test Venue',
        2,
        5
      ) $$,
      'team events may configure a minimum size below three'
  );

select
  throws_ok(
    $$
    insert into
      public.events (
        name,
        slug,
        short_description,
        description,
        event_type,
        category,
        venue,
        min_team_size,
        max_team_size
      )
    values
      (
        'Team Wrong Maximum',
        'team-wrong-maximum',
        'Short',
        'Description',
        'team',
        'Testing',
        'Test Venue',
        3,
        6
      ) $$,
      '23514',
       null,
      'team event maximum size must be 5'
  );

select
  throws_ok(
    $$
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
        'f2000000-0000-4000-8000-000000000002',
        'Invalid Status Team',
        'CONSTRAINT-TEAM-002',
        'f1000000-0000-4000-8000-000000000001',
        'open'
      ) $$,
      '23514',
       null,
      'team status must be forming, registered, or cancelled'
  );

select
  throws_ok(
    $$
    insert into
      public.registrations (event_id, status)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'registered'
      ) $$,
      '23514',
       null,
      'registration must identify a participant or a team'
  );

select
  throws_ok(
    $$
    insert into
      public.registrations (event_id, user_id, team_id, status)
    values
      (
        'f2000000-0000-4000-8000-000000000002',
        'f1000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        'registered'
      ) $$,
      '23514',
       null,
      'registration cannot identify both a participant and a team'
  );

select
  throws_ok(
    $$
    insert into
      public.registrations (event_id, user_id, status)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000002',
        'pending'
      ) $$,
      '23514',
       null,
      'registration status must be registered or cancelled'
  );

select
  throws_ok(
    $$
    insert into
      public.attendance (event_id, status, marked_by)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'present',
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'attendance must identify a participant or a team'
  );

select
  throws_ok(
    $$
    insert into
      public.attendance (event_id, user_id, team_id, status, marked_by)
    values
      (
        'f2000000-0000-4000-8000-000000000002',
        'f1000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        'present',
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'attendance cannot identify both a participant and a team'
  );

select
  throws_ok(
    $$
    insert into
      public.attendance (event_id, user_id, status, marked_by)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000001',
        'late',
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'attendance status must be present or absent'
  );

select
  throws_ok(
    $$
    insert into
      public.results (event_id, position, declared_by)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        1,
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'result must identify a participant or a team'
  );

select
  throws_ok(
    $$
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
        'f2000000-0000-4000-8000-000000000002',
        'f1000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        1,
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'result cannot identify both a participant and a team'
  );

select
  throws_ok(
    $$
    insert into
      public.results (event_id, user_id, position, declared_by)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000001',
        0,
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'result position cannot be below first place'
  );

select
  throws_ok(
    $$
    insert into
      public.results (event_id, user_id, position, declared_by)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000001',
        4,
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23514',
       null,
      'result position cannot exceed third place'
  );

insert into
  public.results (event_id, user_id, position, declared_by)
values
  (
    'f2000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    1,
    'f1000000-0000-4000-8000-000000000003'
  );

select
  throws_ok(
    $$
    insert into
      public.results (event_id, user_id, position, declared_by)
    values
      (
        'f2000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000002',
        1,
        'f1000000-0000-4000-8000-000000000003'
      ) $$,
      '23505',
       null,
      'only one result can occupy a place in an event'
  );

select
  throws_ok(
    $$
    insert into
      public.event_files (event_id, file_name, file_path, file_type)
    values
      (
        'f2000000-0000-4000-8000-000000000099',
        'missing.pdf',
        'missing/missing.pdf',
        'application/pdf'
      ) $$,
      '23503',
       null,
      'event files must reference an existing event'
  );

select
  throws_ok(
    $$
    insert into
      public.payment_records (user_id, amount, payment_method, status)
    values
      (
        'f1000000-0000-4000-8000-000000000099',
        250,
        'offline',
        'pending'
      ) $$,
      '23503',
       null,
      'payment records must reference an existing profile'
  );

select
  *
from
  finish();

rollback;