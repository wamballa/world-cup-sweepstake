# Pre-Scaffold Architecture Plan

This plan locks the architecture direction before app scaffolding. It does not create app source code.

## Scope

The MVP is a friendly office World Cup 2026 sweepstake:

- Admins create a sweepstake, add participants, add optional emails, add admins, allocate teams, rerun allocation, and manually move teams between participants.
- Participants use an unguessable read-only scoreboard link.
- The app shows leaderboard, participants, teams, badges, matches, stats, AI summaries, and email updates.
- There are no entry fees, prize pots, physical prize workflows, passcodes, prediction flows, or admin scoring customization in MVP.

## Stack

- Next.js App Router with TypeScript.
- Tailwind CSS and shadcn/ui.
- Motion or Framer Motion for focused interaction polish.
- Supabase Postgres, Auth, Realtime, and RLS.
- football-data.org API v4 free tier through server-side sync only.
- OpenAI API through server-side generation only.
- Email provider to be chosen before email implementation.
- Vitest for unit/integration tests.
- Playwright for critical mobile journeys.
- Vercel hosting and Vercel Cron.

## Runtime Boundaries

### Browser

- Renders presentation UI and shared scoreboard views.
- Reads only app-owned cached data through safe Supabase access or server-rendered data.
- Never calls football-data.org, OpenAI, email provider APIs, or Supabase service-role operations.
- Cannot perform admin mutations from participant scoreboard links.

### Next.js Server

- Owns authenticated admin mutations.
- Owns shared-link lookup and authorization checks.
- Runs fair allocation, manual allocation moves, scoring, badge calculation, AI generation, and email dispatch.
- Exposes server-side route handlers for Vercel Cron sync.
- Uses service-role Supabase access only in server-only modules.

### Supabase

- Stores sweepstakes, admins, participants, emails, teams, allocations, scores, badges, sync state, AI generations, and email logs.
- Enforces RLS for user-scoped and shared-link-scoped reads.
- Keeps participant email data more protected than display names.
- Provides Realtime only where it improves the scoreboard/admin experience.

### Vercel Cron

- Runs scheduled football-data.org sync jobs.
- Calls protected server-side sync endpoints or server jobs.
- Must authenticate using a sync secret.
- Must stay within the free-tier 10 calls/minute football-data.org limit.

## Initial Route Shape

Exact filenames can be adjusted during scaffold, but the app should separate admin and participant surfaces:

- `/` or `/new`: create sweepstake entry point.
- `/admin`: admin dashboard landing.
- `/admin/sweepstakes/[sweepstakeId]`: admin management view.
- `/admin/sweepstakes/[sweepstakeId]/allocation`: allocation review, rerun, and manual team move controls.
- `/s/[shareToken]`: read-only participant scoreboard.
- `/api/cron/football-data-sync`: Vercel Cron sync endpoint.
- `/api/ai/sweepstake-update`: server-side AI generation endpoint or server action.
- `/api/email/updates`: server-side email update endpoint or server action.

## Initial Module Shape

After scaffold:

- `app/`: routes, layouts, server components, route handlers.
- `components/`: reusable UI primitives and app shell components.
- `features/sweepstakes/`: create/edit sweepstake workflows.
- `features/participants/`: participant entry, email capture, display helpers.
- `features/allocation/`: fair allocation, allocation review, reruns, manual moves.
- `features/teams/`: team views and tournament status.
- `features/leaderboard/`: participant totals, ranking, tie display.
- `features/badges/`: badge category definitions and badge holder calculation.
- `features/matches/`: fixtures, results, freshness labels.
- `features/stats/`: tournament and team stats.
- `features/ai/`: cached AI summaries and banter surfaces.
- `features/email/`: update preferences and email content triggers.
- `lib/`: pure utilities, validation, typed domain helpers.
- `server/`: server-only clients, privileged operations, sync, AI, email.
- `supabase/`: migrations, seeds, local config.
- `tests/`: Vitest and Playwright support.

## Core Data Model

Initial tables:

- `profiles`
- `sweepstakes`
- `sweepstake_admins`
- `participants`
- `participant_emails`
- `badge_categories`
- `teams`
- `team_allocations`
- `allocation_audit_events`
- `matches`
- `team_match_stats`
- `team_scores`
- `participant_scores`
- `badge_holders`
- `football_data_sync_runs`
- `football_data_sync_state`
- `ai_generations`
- `email_update_logs`

## Key Data Rules

- Store all 48 teams.
- Store allocations separately from participants and teams.
- Store allocation audit events for initial draw, reruns, and manual team moves.
- Store scoring outputs so leaderboard reads are fast, but keep scoring recalculable from cached matches and allocations.
- Store badge holders as derived data, recalculable from cached football data and allocations.
- Store AI outputs with input hashes and source timestamps.
- Store email logs separately from participant display data.

## Scoring

The MVP uses one fixed scoring model:

- Group stage win: 3 points.
- Group stage draw: 1 point.
- Reach Round of 16: 5 points.
- Reach Quarter-final: 8 points.
- Reach Semi-final: 12 points.
- Runner-up: 15 points.
- Win the World Cup: 25 points.

Participant score is the sum of allocated team scores. Admin scoring customization is post-MVP.

## Badges

Automated MVP badges:

- 1st Place.
- 2nd Place.
- 3rd Place.
- 4th Place.
- Wooden Spoon.
- First Knocked Out.
- Most Goals Conceded.
- Fewest Goals Scored.

Manual/future on football-data.org free tier unless better data is available:

- Most Cards.
- Golden Boot Team.
- Golden Glove Team.

Leaderboard ties share ranks. Badge categories can have shared holders. The app should not invent artificial team-level tie-breakers.

## Football Data

Use football-data.org API v4 free tier:

- Competition: `WC` / `2000`.
- Season: `2026` where supported.
- Scores and schedules are delayed.
- Limit: 10 authenticated calls/minute.
- Core endpoints:
  - `GET /v4/competitions/WC`
  - `GET /v4/competitions/WC/teams?season=2026`
  - `GET /v4/competitions/WC/matches?season=2026`
  - `GET /v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE`
  - `GET /v4/competitions/WC/matches?season=2026&status=FINISHED`
  - `GET /v4/matches/{id}` for targeted refreshes.
  - `GET /v4/competitions/WC/standings?season=2026` only if available; the app must not depend on it.

The frontend reads cached Supabase data only. If standings are unavailable for the World Cup, derive app scoring and badges from cached matches.

## Sync Strategy

- Vercel Cron triggers central server-side sync.
- Fixtures and schedule: daily.
- Matches within 48 hours: every 2 to 4 hours.
- Matchday active window: every 15 to 30 minutes if the free tier and delayed-score behavior make this useful.
- Completed matches: re-check after final and once the next day for corrections.
- Every sync records status, timestamps, endpoint, duration, records changed, and errors.
- Failed syncs preserve the previous known-good cache.

## AI Strategy

- AI is in MVP but never authoritative.
- AI may use only cached fixtures, scores, statuses, team stats, allocations, leaderboard, badges, scoring rules, and data freshness timestamps.
- AI must not invent football facts, live claims, injuries, lineups, form, statistics, badge holders, or future outcomes.
- Cache AI generations by feature type, input hash, source timestamps, model, and creation time.

## Email Strategy

- Email updates are in MVP.
- Provider is still undecided.
- Participant emails are protected separately from display names.
- Email sends should be logged in `email_update_logs`.
- Email content must use cached app data and should respect delayed/stale data labels.

## Security

- Supabase Auth is used for admins.
- Participant scoreboard links use unguessable tokens and read-only access.
- Admin mutations require server-side authorization.
- Service role, football-data.org, OpenAI, email provider, and sync secrets are server-only.
- RLS must protect admin data, participant emails, allocation mutations, badge calculations, AI generations, and email logs.
- Rate limit AI generation and participant email submissions.

## Testing Implications

Unit tests must cover:

- Fair allocation for even and uneven participant counts.
- Allocation reruns and manual team moves preserving all 48 teams.
- Team scoring.
- Participant totals.
- Leaderboard tie handling.
- Badge holder calculations.
- Mocked football-data.org sync behavior.

Playwright must cover:

- Admin create sweepstake.
- Participant entry.
- Allocation and shared scoreboard link.
- Participants, Teams, Badges, Matches, and Stats tabs.
- Stale/delayed data states.
- Participant email capture.

## Open Decisions Before Build

- Whether participant emails require verification before updates.
- Which badge categories are shown by default versus hidden/manual/future.
- How First Knocked Out handles multiple teams eliminated on the same day.
- Whether manual/future badges appear disabled, hidden, or manually editable.
- Final email provider.
- Canonical first-launch deployment environment.
