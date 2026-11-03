-- Newly issued verification codes use six uppercase letters/digits. Existing
-- issued codes remain usable so participants are not locked out during rollout.
create or replace function public.issue_verification_code(
    p_user_id uuid,
    p_payment_id uuid,
    p_custom_code text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_code text;
    v_code_id uuid;
    v_is_custom boolean;
    v_attempt integer;
    v_byte integer;
    v_alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
begin
    if not public.is_admin() then
        raise exception 'Only admins can issue verification codes';
    end if;

    if not exists (
        select 1
        from public.payment_records
        where id = p_payment_id
          and user_id = p_user_id
          and status = 'verified'
    ) then
        raise exception 'Verified payment not found for this user';
    end if;

    if exists (
        select 1
        from public.verification_codes
        where user_id = p_user_id
          and status = 'issued'
    ) then
        raise exception 'User already has an issued verification code';
    end if;

    v_is_custom := p_custom_code is not null and length(trim(p_custom_code)) > 0;

    if v_is_custom then
        v_code := upper(trim(p_custom_code));
        if v_code !~ '^[A-Z0-9]{6}$' then
            raise exception 'Custom verification code must be exactly 6 characters using A-Z and 0-9';
        end if;

        insert into public.verification_codes (user_id, payment_id, code, status)
        values (p_user_id, p_payment_id, v_code, 'issued')
        on conflict (code) do nothing
        returning id into v_code_id;

        if v_code_id is null then
            raise exception 'Verification code already exists';
        end if;
    else
        -- Rejection sampling avoids modulo bias when mapping random bytes to
        -- the 36 characters in the permitted alphabet.
        for v_attempt in 1..20 loop
            v_code := '';
            while length(v_code) < 6 loop
                v_byte := get_byte(extensions.gen_random_bytes(1), 0);
                if v_byte < 252 then
                    v_code := v_code || substr(v_alphabet, (v_byte % 36) + 1, 1);
                end if;
            end loop;

            v_code_id := null;
            insert into public.verification_codes (user_id, payment_id, code, status)
            values (p_user_id, p_payment_id, v_code, 'issued')
            on conflict (code) do nothing
            returning id into v_code_id;

            exit when v_code_id is not null;
        end loop;

        if v_code_id is null then
            raise exception 'Could not generate a unique verification code. Please try again';
        end if;
    end if;

    insert into public.audit_logs (admin_id, action, entity_type, entity_id, metadata)
    values (
        auth.uid(),
        'ISSUE_VERIFICATION_CODE',
        'verification_code',
        v_code_id,
        jsonb_build_object(
            'user_id', p_user_id,
            'payment_id', p_payment_id,
            'custom_code', v_is_custom
        )
    );

    return v_code_id;
end;
$$;

revoke execute on function public.issue_verification_code(uuid, uuid, text) from anon;
revoke execute on function public.issue_verification_code(uuid, uuid, text) from public;
grant execute on function public.issue_verification_code(uuid, uuid, text) to authenticated;
