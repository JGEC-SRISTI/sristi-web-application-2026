# Initial admin bootstrap

The first `SUPER_ADMIN` cannot be created through `create_admin`, because that RPC requires an existing super admin. `supabase/seed.sql` intentionally contains no user accounts. Bootstrap the first admin through a trusted database connection after the user has signed up.

## Local development

1. Start the local Supabase stack and sign up or sign in with the intended development account.
2. In the local Supabase SQL Editor, confirm the editor is connected to the local project and is running as `postgres`.
3. Find the account's Auth UUID:

   ```sql
   select id, email
   from auth.users
   where email = 'YOUR_LOCAL_ACCOUNT_EMAIL';
   ```

4. Replace the UUID below with that account's `auth.users.id`, then run this once:

   ```sql
   insert into public.admin_users (user_id, role, status)
   select 'YOUR_AUTH_USER_UUID'::uuid, 'SUPER_ADMIN', 'active'
   where not exists (select 1 from public.admin_users)
   returning user_id, role, status;
   ```

   This inserts only when the admin table is empty. If it returns no row, an admin already exists; use the authorized admin-management RPCs instead of bypassing them.

5. Sign out and back in as the new super admin so the frontend receives a current session, then verify the admin route and RPCs.

The bootstrap grant is a one-time trusted setup action and is not written to `seed.sql`. Keep local account IDs and credentials out of the repository.

## Hosted project

Do not use a public RPC, frontend code, or a committed seed record to create the first production super admin. Provision the chosen Auth user through an approved, trusted operator procedure against the intended hosted project, then use the protected admin RPCs for subsequent admin changes. Confirm the target project and account before applying the grant.
