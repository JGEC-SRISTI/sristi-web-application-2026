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
| `create_team` | `{ p_event_id: string, p_team_name: string }` | team UUID | Signed-in verified participant; creates a team and generates its code server-side |
| `join_team` | `{ p_team_code: string }` | team UUID | Signed-in verified participant; joins a forming team subject to capacity and membership rules |
| `register_team` | `{ p_team_id: string }` | `boolean` | Team leader; marks a team ready after its 3–5 member size is valid |
| `register_team_event` | `{ p_team_id: string }` | registration UUID | Team leader; registers the ready team for its event |

After successful code submission, refresh the UI state by calling `is_verified_user`. Registration and team RPCs enforce eligibility themselves; a frontend check is only for user experience.

RPC example:

```ts
const { data, error } = await supabase.rpc('register_solo_event', {
  p_event_id: eventId,
});
```

Handle the returned `error` for every request. Database functions raise errors for invalid, unauthorized, duplicate, or ineligible operations; map those to helpful UI messages rather than relying only on client-side checks.

## Admin payment and verification-code workflow

The following RPCs require an active admin; the function enforces the role:

| RPC | Arguments | Result |
| --- | --- | --- |
| `verify_offline_payment` | `{ p_user_id: string, p_payment_reference?: string }` | payment UUID |
| `issue_verification_code` | `{ p_user_id: string, p_payment_id: string, p_custom_code?: string }` | verification-code row UUID |

`issue_verification_code` returns the row UUID, not the code text. An authorized admin may read the row by that UUID to retrieve the code for delivery. Participants cannot read verification-code rows directly; they submit the code through `verify_participant_code`.

## Current integration boundaries

- Public event and fest-setting reads are available through their tables under RLS.
- Event-file metadata can be read publicly, but the `event-files` Storage bucket is private and file access requires authentication. Admins manage objects.
- `profiles` has no email column; do not expect it in a profile query.
- Configure Google Auth and production redirect URLs in Supabase before deployment. The checked-in local config does not contain provider credentials.
- This contract covers existing schema functions and policies. It does not imply that the admin UI, OAuth provider setup, cloud migration deployment, or export workflows are already complete.
