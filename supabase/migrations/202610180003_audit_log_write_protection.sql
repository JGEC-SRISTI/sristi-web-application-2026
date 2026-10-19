-- Audit records must be written by trusted backend workflows, not directly
-- through the Data API where an admin could create misleading entries.
drop policy if exists "Admins can create audit logs"
    on public.audit_logs;

revoke insert on table public.audit_logs
    from anon, authenticated, public;
