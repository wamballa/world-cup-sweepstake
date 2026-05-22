# Technical Decisions

## Tech Decision Lock

Status: Locked on 2026-05-19.

This document is the source of truth for implementation decisions unless a later entry in `/planning/decision-log.md` changes them. The app has already been scaffolded in this workspace; future build work should treat the locked decisions below as constraints, not as permission to broaden scope.

## Stack

- Next.js App Router with TypeScript.
- Tailwind CSS v4 and shadcn/ui.
- Motion for focused interface transitions.
- Supabase Postgres, Auth, Realtime, and RLS.
- football-data.org through server-side sync only.
- OpenAI API through server-side AI jobs or route handlers only.
- Email provider to be selected before email implementation.
- Vitest for unit and integration tests.
- Playwright for critical mobile journeys.
- Vercel hosting with Vercel Cron for scheduled sync.

## App Structure

Implementation structure:

- `src/app/` for routes, layouts, server components, and route handlers.
- `src/components/` for reusable UI and app shell components.
- `src/features/` for sweepstakes, participants, allocation, teams, badges, matches, stats, AI, and email.
- `src/lib/` for shared utilities, deterministic domain helpers, validation, and safe client helpers.
- `src/server/` for server-only Supabase clients, privileged mutations, sync, AI, email, and cron helpers.
- `tests/` for Playwright support.
- `src/test/` for Vitest support.
- `supabase/` for migrations, seeds, and local config once Supabase work begins.

Pure allocation, scoring, badge, and leaderboard logic should live outside route handlers so it can be unit tested and recalculated from stored data.

## Route Boundaries

- `/` or `/new`: public sweepstake creation entry point.
- `/admin`: authenticated admin dashboard.
- `/admin/sweepstakes/[sweepstakeId]`: authenticated admin management view.
- `/admin/sweepstakes/[sweepstakeId]/allocation`: authenticated allocation review, rerun, and manual team moves.
- `/s/[shareToken]`: unguessable read-only participant scoreboard.
- `/api/cron/football-data-sync`: server-only scheduled sync endpoint protected by a sync secret.
- AI and email routes or server actions must remain server-side and read only cached app data.

## Database Tables

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

## Client-Side

- Presentation UI.
- Admin setup forms for sweepstake configuration and participant entry.
- Shared sweepstake view with Participants, Teams, Badges, Matches, and Stats tabs.
- Supabase realtime subscriptions for sweepstake updates where useful.
- No client-side football-data.org, OpenAI, email-provider, Supabase service-role, or sync-secret access.

## Server-Side

- Authenticated admin mutations.
- Shared link access checks.
- Random team allocation.
- Team scoring and leaderboard recalculation.
- Badge category calculation.
- football-data.org polling and caching.
- OpenAI calls and AI output caching.
- Email update generation and sending.
- Service role operations.
- Allocation audit logging for initial draws, reruns, and manual allocation moves.

## Deployment Model

Use a Vercel-hosted Next.js app with Supabase as managed backend. Run scheduled football data sync through Vercel Cron. Supabase remains the cache and persistence layer; Vercel owns scheduled server-side sync execution.

## Testing Lock

- Vitest covers deterministic allocation, scoring, badge, leaderboard, match-status, and AI-input validation logic.
- Playwright covers critical mobile admin and participant journeys.
- API sync tests must use fixtures or mocked fetch clients and must never require real football-data.org credentials.
- Implementation should add tests alongside each domain feature rather than leaving the full quality gate until the end.

## Still Open

The following are intentionally not locked in this phase:

- Final email provider.
- Whether participant emails require verification before updates.
- Exact polling cadence after real plan limits are confirmed.
- Whether manual/future badge categories are hidden, disabled, or manually editable in the MVP UI.
