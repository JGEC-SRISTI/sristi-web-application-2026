-- Generate shorter human-readable invite codes for newly created teams.
-- Existing team codes remain valid because join_team still looks them up as text.
create
or replace function public.generate_team_code() returns text language plpgsql security definer
set
    search_path = public as $$ declare v_code text;

begin loop v_code := upper(encode(extensions.gen_random_bytes(4), 'hex'));

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

$$;
