# Security Model

## Auth

Use Supabase Auth for admins. Participants may view a shared sweepstake link without accounts unless a private access mode is enabled.

## RLS Policies

Tables needing RLS or equivalent server-side protection:

- `profiles`: users read limited public profile data, update only self.
- `sweepstakes`: public/private shared link rules, admin write access.
- `sweepstake_admins`: visible and editable only by authorised admins.
- `participants`: visible through the sweepstake link, editable by admins; participant email updates need verification or tokenized access.
- `participant_emails`: protected more tightly than display names.
- `badge_categories`: visible through sweepstake link, editable by admins.
- `team_allocations`: visible through sweepstake link, created by admin-only allocation flow.
- `team_scores`: visible through sweepstake link, written by server-side scoring jobs.
- `participant_scores`: visible through sweepstake link, written by server-side scoring jobs.
- `badge_holders`: visible through sweepstake link, written by server-side badge calculations.
- `ai_generations`: visible only where the source sweepstake context allows.

## Shared Links

Shared links should use unguessable slugs or tokens. Admin actions must not be possible from public participant views.

## Server-Only Secrets

Never expose these to the browser:

- Supabase service role key.
- football-data.org API key.
- OpenAI API key.
- Email provider API key.
- Sync job secrets.

## Server-Side Operations

Use server-side authorization for:

- Creating sweepstakes.
- Adding admins.
- Editing participants and badge categories.
- Randomly allocating teams.
- Recalculating scores and badges.
- Running sync jobs.
- Calling OpenAI.
- Sending email updates.

## Abuse Prevention

- Rate-limit AI generation.
- Rate-limit participant email submissions.
- Validate participant names and email addresses.
- Log privileged sync, allocation, and scoring operations.
- Avoid storing unnecessary personal data.
