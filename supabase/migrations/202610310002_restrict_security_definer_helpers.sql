-- has_profile() is an unused SECURITY DEFINER helper. Revoke the default
-- PUBLIC execute privilege so it cannot be called through the Data API.
revoke execute on function public.has_profile()
    from anon, authenticated, public;
