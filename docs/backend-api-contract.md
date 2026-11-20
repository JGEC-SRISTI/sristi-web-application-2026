# Backend integration contract

This document describes the Supabase interfaces currently implemented by the migrations on `develop`. The frontend calls Supabase directly through `supabase-js`; there is no separate Express API.

## Client configuration and authentication

- Configure the browser client with the Supabase project URL and public anon/publishable key, typically through `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Never place a service-role key or database password in frontend code or `VITE_` variables.
- Google sign-in uses `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`. Google must also be enabled and its redirect URLs configured in Supabase Auth; credentials belong in Supabase settings, not this repository.
- Use the Supabase Auth session. `supabase-js` manages session persistence, access-token attachment, and refresh-token rotation. Do not create, store, or refresh custom tokens in app code.
- Use `getSession` / `onAuthStateChange` for UI state. Route guards are for navigation only; RLS and RPC authorization remain the security boundary.

## Participant profile

`public.profiles` is keyed by the Supabase Auth user UUID (`id`). The participant can select, insert, and update only their own row under RLS.

Required profile payload fields:

| Field | Type | Validation |
| --- | --- | --- |
| `full_name` | text | Required; cannot be blank or whitespace-only |
| `phone` | text | Required; cannot be blank or whitespace-only |
| `college_name` | text | Required; cannot be blank or whitespace-only |
| `college_roll` | text | Required; cannot be blank or whitespace-only |
| `department` | text | Required; cannot be blank or whitespace-only |
| `academic_year` | number | Integer from 1 through 4 |

Set `id` to `session.user.id`. The table does not currently store email; display it from `session.user.email`. Trim text inputs in the UI, but treat database validation as authoritative. `created_at` and `updated_at` are database-managed.

Suggested onboarding behavior: after sign-in, select the profile by `id`; route users without a row to profile setup and users with a row to the signed-in area. Profile operations use `supabase.from('profiles')`; no profile RPC exists.

## Verification and registration RPCs

Call these through `supabase.rpc(name, args)`. They are protected database functions, not custom HTTP routes.

| RPC | Arguments | Result | Intended caller / behavior |
| --- | --- | --- | --- |
| `verify_participant_code` | `{ p_code: string }` | `boolean` | Signed-in participant; consumes their own issued code or returns an error |
| `is_verified_user` | `{}` | `boolean` | Signed-in participant; true only when payment is verified and its linked code is used |
| `can_register_solo_event` | `{ p_event_id: string }` | `boolean` | Signed-in participant; eligibility check for a solo event |
| `register_solo_event` | `{ p_event_id: string }` | registration UUID | Signed-in verified participant; creates a solo registration |
| `create_team` | `{ p_event_id: string, p_team_name: string, p_member_info_consent: true }` | team UUID | Signed-in verified participant; creates a forming team, records consent on the leader membership, and generates an 8-character uppercase hexadecimal invite code server-side |
| `join_team` | `{ p_team_code: string, p_member_info_consent: true }` | team UUID | Signed-in verified participant; records consent on the new membership and joins a forming team subject to the event's configured capacity |
| `get_team_roster` | `{ p_team_id: string }` | rows of `{ full_name, is_leader, is_you }` | Authenticated member of the team; returns the full roster and rejects non-members |
| `finalize_team_registration` | `{ p_team_id: string }` | registration UUID | Verified team leader; registers a team whose member count meets the event's configured size range and returns the existing UUID on retries |
| `delete_team` | `{ p_team_id: string }` | `boolean` | Signed-in team leader; permanently deletes the team and its registration; returns `false` if the team no longer exists; rejects deletion if attendance or results exist |
| `register_team` | `{ p_team_id: string }` | `boolean` | Team leader; legacy/manual operation that marks a forming team registered after its configured size is valid |
| `register_team_event` | `{ p_team_id: string }` | registration UUID | Team leader; legacy/manual operation that registers a registered team for its event |

After successful code submission, refresh the UI state by calling `is_verified_user`. Registration and team RPCs enforce eligibility themselves; a frontend check is only for user experience.

RPC example:

```ts
const { data, error } = await supabase.rpc('register_solo_event', {
  p_event_id: eventId,
});
```

Handle the returned `error` for every request. Database functions raise errors for invalid, unauthorized, duplicate, consent, capacity, or registration failures; map those to helpful UI messages rather than relying only on client-side checks.

The consent checkbox for creating or joining a team must be explicit and submit `true`; omitted or false consent is rejected. Consent is stored on `team_members.member_info_consent`. Do not query `profiles` to display teammates: it contains private fields. Use `get_team_roster` for the event UI; it returns only `full_name`, `is_leader`, and `is_you`, and names are visible only to authenticated members of that team. The roster does not hide names based on the consent flag.

## Admin payment and verification-code workflow

The following RPCs require an active admin; the function enforces the role:

| RPC | Arguments | Result |
| --- | --- | --- |
| `verify_offline_payment` | `{ p_user_id: string, p_payment_reference?: string }` | payment UUID |
| `issue_verification_code` | `{ p_user_id: string, p_payment_id: string, p_custom_code?: string }` | verification-code row UUID |

`issue_verification_code` returns the row UUID, not the code text. An authorized admin may read the row by that UUID to retrieve the code for delivery. Participants cannot read verification-code rows directly; they submit the code through `verify_participant_code`.

## Admin and event-management operations

Admin operations use the signed-in Supabase session. RLS and each RPC enforce authorization; hiding admin controls in the UI is not an authorization check.

| Operation | Supabase call | Access / behavior |
| --- | --- | --- |
| Read or manage events | `supabase.from('events').select/insert/update/delete` | Event reads are public; writes require an active admin. |
| Read or manage fest settings | `supabase.from('fest_settings').select/insert/update/delete` | Reads are public; writes require an active admin. |
| Read or manage event-file metadata | `supabase.from('event_files').select/insert/update/delete` | Reads are public; metadata writes require an active admin. Upload/delete the actual object through Supabase Storage; the bucket is private. |
| Read profiles and payments for admin workflows | `supabase.from('profiles'/'payment_records').select` | Admins can read all rows; participants remain limited by RLS. |
| Read admin accounts | `supabase.from('admin_users').select` | Requires an active admin. Do not write this table directly. |
| Create an admin | `supabase.rpc('create_admin', { p_user_id, p_role })` | Super admin only. `p_role` is `ADMIN` or `SUPER_ADMIN` and defaults to `ADMIN`; returns the admin row UUID. |
| Change an admin role/status | `supabase.rpc('update_admin', { p_admin_id, p_role, p_status })` | Super admin only; status is `active` or `inactive`; returns `boolean`. |
| Deactivate an admin | `supabase.rpc('deactivate_admin', { p_admin_id })` | Super admin only; prevents self-deactivation and records the action; returns `boolean`. Admin deletion is not supported. |
| Mark attendance | `supabase.rpc('mark_attendance', { p_event_id, p_user_id, p_team_id, p_status })` | Active admin only. Supply the participant or team target appropriate to the event; status is `present` or `absent` and defaults to `present`; returns the attendance UUID. |
| Declare a result | `supabase.rpc('declare_result', { p_event_id, p_user_id, p_team_id, p_position })` | Active admin only. Supply either a participant or team target appropriate to the event; `p_position` is the placing; returns the result UUID. |
| Publish or hide the leaderboard | `supabase.rpc('set_leaderboard_visibility', { p_is_public })` | Active admin only; returns `boolean`. |

For optional SQL arguments, pass `null` for the unused participant/team target where needed. Check every returned `error`; do not treat a successful client-side role check as proof that a write was authorized.

Example admin RPC call:

```ts
const { data, error } = await supabase.rpc('mark_attendance', {
  p_event_id: eventId,
  p_user_id: participantId,
  p_team_id: null,
  p_status: 'present',
});
```

The frontend must not write directly to `admin_users` or `audit_logs`. Admin account changes must use the RPCs above; audit logs are read-only through the Data API.

## Current integration boundaries

- Public event and fest-setting reads are available through their tables under RLS.
- Event-file metadata and brochure objects can be read publicly. Upload, update, and delete operations on the `event-files` Storage bucket require an active admin.
- Team events store their member rule in `min_team_size` and `max_team_size`. Equal values require a fixed team size; different values define an inclusive range. Valid team sizes are 1 through 5, and team registration is enforced against the event's configured rule.
- `create_team` and `join_team` perform automatic registration in the same database transaction after inserting the member. If the resulting count is below `min_team_size`, the team remains `forming`. Once the minimum is reached, the team is atomically marked `registered` and a team registration is created; it no longer accepts additional members, even when the configured maximum is larger. A count above `max_team_size` is rejected.
- Automatic registration is backend-owned and does not require the joining participant to be the team leader. `finalize_team_registration` is also available for the verified leader and is idempotent: once a registered row exists, it returns that registration UUID. It is duplicate-safe through the active team-registration uniqueness constraint.
- Team roster reads go through `get_team_roster`; only a member of the requested team can call it successfully. Team registration reads are likewise available to every member of the team, not only its leader.
- `delete_team` is the supported team removal path because authenticated clients cannot delete team rows directly. Only the team leader may delete a team. Deletion cascades to its team members and registrations; teams with attendance or results cannot be deleted so event history is preserved. The frontend should update the event and Registered Events views only after the RPC returns `true`.
- `profiles` has no email column; do not expect it in a profile query.
- Configure Google Auth and production redirect URLs in Supabase before deployment. The checked-in local config does not contain provider credentials.
- This contract covers existing schema functions and policies. It does not imply that the admin UI, OAuth provider setup, cloud migration deployment, or export workflows are already complete.
