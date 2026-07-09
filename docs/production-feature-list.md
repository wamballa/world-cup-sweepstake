# Production Feature List

Last reviewed: 2026-07-09

This document is the quick inventory of product behavior currently live or production-ready. It is not the backlog and should not track future work sequencing. Use `/backlog.md` for work items and `/planning/decision-log.md` for why major decisions were made.

## Admin

- Supabase Auth-backed admin access.
- Admin dashboard for owned sweepstakes.
- Sweepstake creation and archive flow.
- Participant management with add, edit, delete, and duplicate-name validation.
- Fair random allocation of World Cup teams across participants.
- Allocation review with rerun/manual allocation support where implemented.
- Share link panel with copyable public shared-board URL.
- Shared link display mode switch: participant board or countdown page.
- Main board UI switch: official board or Alternative Board.
- Manual football-data sync and sync diagnostics.
- AI sweepstake update controls, including admin rewrite where available.
- Alternative Board-only Keepy-Uppy high-score reset with confirmation.

## Shared Participant Board

- Public read-only shared scoreboard at `/s/[shareToken]`.
- Official board view with Participants, Teams, Badges, Matches, Stats, and Explainer surfaces.
- Countdown page mode on the same shared link.
- Mobile-first, campaign-style visual direction.
- Participant leaderboard derived from cached allocations and team performance.
- Badge holders derived from cached app data.
- Match and fixture views using cached football data.
- Last Updated/freshness display based on server-side sync state.
- UK-facing kickoff labels formatted in `Europe/London`.

## Alternative Board

- Admin-selectable board variant on the normal public shared URL.
- Top summary header with sweepstake name, player count, team count, and Last Updated.
- Hero panel with Shared scoreboard pill, large heading, and compact Today's matches section.
- Today's matches show up to six fixtures in a responsive grid.
- Completed hero fixtures show scorelines instead of the generic final status.
- Fallback to the next upcoming match when there are no matches today.
- Participants, Teams, Badges, Matches, Stats, and Explainer tabs using the Alternative Board model.
- Team-first scoring and ranking model separate from the official board scoring display.
- Alternative Board team scores use group-stage points plus one non-cumulative furthest-stage bonus: Last 32 `+0`, Round of 16 `+10`, Quarter-final `+16`, Semi-final `+24`, runner-up `+30`, winner `+100`.
- Alternative Board participant scores use the average of allocated Alternative Board team scores, displaying one decimal place only when needed and sharing ranks for tied averages.
- Sticky board navigation and table headers on supported Alternative Board tabs.
- Alternative Board copy avoids presenting itself as a hidden/experimental board to participants.

## Keepy-Uppy Challenge

- Alternative Board-only hero mini-game.
- Compact hero pill: `Keep-ups X · Hi Score Y`.
- Sweepstake-scoped shared top-10 high-score table.
- Server route handlers for reading and submitting scores.
- Name validation, score validation, and server-side Alternative Board/share-token checks.
- Hi Score button opens a top-10 dialog.
- Qualifying top-10 streaks ask for a player name.
- New highest streaks use `New high score`; other qualifying entries use `You made the top 10`.
- Positive non-qualifying streaks show `Sorry, you didn't make it` with the current top 10.
- Preview/no-share-token boards remain local-only and do not write persistent scores.
- Mini-game scores never affect football scoring, badges, allocations, or sweepstake standings.

## Football Data

- Frontend never calls `football-data.org` directly.
- Server-side sync caches football teams, fixtures, scores, statuses, standings, and related stats in Supabase.
- Vercel Cron calls `/api/cron/football-data-sync`.
- Sync runs and sync state are persisted for freshness/diagnostics.
- Participant-facing labels account for delayed free-tier score data.
- Scoring and leaderboards are recalculable from cached data.

## AI

- Cached AI sweepstake updates grounded only in stored app data.
- AI output is secondary to factual leaderboard, fixture, badge, and scoring data.
- AI does not alter scores, allocations, badges, standings, or official outcomes.
- Narrative generation is cached/reused to avoid repeated token use for the same factual state.

## Security And Data Boundaries

- Supabase service-role access is server-only.
- Shared links are unguessable and read-only for participants.
- Admin mutations require authenticated admin authorization.
- Keepy-Uppy persistence uses `keepy_uppy_scores`, separate from official sweepstake scoring tables.
- `keepy_uppy_scores` has RLS enabled and no anon/browser policies.
