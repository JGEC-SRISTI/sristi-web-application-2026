-- Public event pages use the Supabase anon key before a participant signs in.
grant select on table public.events to anon;
