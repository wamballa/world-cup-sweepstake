# Backlog

Use unique IDs when discussing work items. Keep IDs stable once created. Move items between phases or status markers rather than renumbering.

This backlog is for a World Cup 2026 sweepstake app. Admins create sweepstakes, add participants, randomly allocate World Cup teams, share a link, and track participant standings based on team performance.

## Phase 0 - Decision Lock

- `BL-001` `[Done]`: Lock MVP scope for admin-created sweepstakes.
- `BL-002` `[Done]`: Decide whether shared sweepstake links need passcodes for MVP.
- `BL-003` `[Done]`: Decide leaderboard and badge tie handling rules.
- `BL-004` `[Done]`: Decide whether allocation is final after sharing or can be reset by admins.
- `BL-005` `[Done]`: Confirm default badge categories for MVP.
- `BL-006` `[Done]`: Confirm MVP scoring model and whether scoring customization is out of scope.
- `BL-007` `[Done]`: Confirm football-data.org plan, rate limits, World Cup 2026 endpoints, and available stats.
- `BL-008` `[Done]`: Choose scheduled sync runtime: Vercel Cron, Supabase scheduled functions, or another scheduler.
- `BL-009` `[Done]`: Produce final pre-scaffold architecture plan.
- `BL-010` `[Done]`: Produce low-fidelity mobile-first wireframe plan before UI build.

## Phase 1 - Scaffold and Design Foundation

- `BL-011` `[Done]`: Scaffold Next.js App Router project when explicitly approved.
- `BL-012` `[Done]`: Configure TypeScript, Tailwind CSS, shadcn/ui, Motion, Vitest, and Playwright.
- `BL-013` `[Done]`: Create base mobile-first layout, navigation, and visual tokens.
- `BL-014` `[Done]`: Create shared UI primitives for buttons, forms, tabs, cards, dialogs, and status labels.
- `BL-015` `[Done]`: Add mock World Cup 2026 team, match, participant, badge, and scoring data.

## Phase 2 - Core Sweepstake Setup

- `BL-016` `[Done]`: Build admin create-sweepstake flow.
- `BL-017` `[Done]`: Add sweepstake name and tournament settings.
- `BL-018` `[Done]`: Build badge category display settings.
- `BL-019` `[Done]`: Build participant name entry for bulk office/group setup.
- `BL-020` `[Done]`: Add participant email capture field for MVP email updates.
- `BL-021` `[Done]`: Add other-admin management.
- `BL-022` `[Done]`: Implement fair random allocation of all 48 teams.
- `BL-023` `[Done]`: Add allocation review and confirmation state.
- `BL-024` `[Done]`: Generate shared sweepstake link.
- `BL-069` `[Done]`: Add admin allocation reset and manual team move controls.

## Phase 3 - Leaderboard and Badge Tracking

- `BL-025` `[ToDo]`: Implement default team performance scoring.
- `BL-026` `[ToDo]`: Calculate participant totals from allocated teams.
- `BL-027` `[ToDo]`: Build participant leaderboard with tie handling.
- `BL-028` `[ToDo]`: Build Participants tab.
- `BL-029` `[ToDo]`: Build Teams tab.
- `BL-030` `[ToDo]`: Build Badges tab.
- `BL-031` `[ToDo]`: Build Matches tab.
- `BL-032` `[ToDo]`: Build Stats tab.
- `BL-033` `[ToDo]`: Calculate MVP badge holders: 1st, 2nd, 3rd, 4th, Wooden Spoon, First Knocked Out, Most Goals Conceded, Fewest Goals Scored, and Most Cards.
- `BL-034` `[Done]`: Mark Most Cards, Golden Boot Team, and Golden Glove Team as manual/future on the free tier.

## Phase 4 - Supabase Persistence

- `BL-035` `[ToDo]`: Create Supabase schema for sweepstakes, admins, participants, badge categories, teams, allocations, matches, scores, badge holders, and sync logs.
- `BL-036` `[ToDo]`: Configure Supabase Auth for admins.
- `BL-037` `[ToDo]`: Implement RLS and server-side authorization for admin-only actions.
- `BL-038` `[ToDo]`: Persist sweepstake setup, participants, badge categories, allocations, and shared-link access.
- `BL-039` `[ToDo]`: Persist team scores, participant scores, and badge holders.
- `BL-040` `[ToDo]`: Protect participant email data separately from display names.
- `BL-070` `[ToDo]`: Persist allocation audit metadata for random reruns and manual team moves.

## Phase 5 - Football Data Integration

- `BL-041` `[ToDo]`: Implement server-side football-data.org client.
- `BL-042` `[ToDo]`: Implement central polling/sync job.
- `BL-043` `[ToDo]`: Cache teams, fixtures, match status, scores, tables, and team stats in Supabase.
- `BL-044` `[ToDo]`: Store sync logs and last successful sync time.
- `BL-045` `[ToDo]`: Add stale, delayed, final, and update-pending data states.
- `BL-046` `[ToDo]`: Recalculate team scores, participant totals, and badge holders after sync.
- `BL-047` `[ToDo]`: Preserve upgrade path for live scores without changing frontend data access.

## Phase 6 - Testing and Hardening

- `BL-048` `[ToDo]`: Unit test fair allocation across even and uneven participant counts.
- `BL-049` `[ToDo]`: Unit test team performance scoring.
- `BL-050` `[ToDo]`: Unit test participant totals and leaderboard tie handling.
- `BL-051` `[ToDo]`: Unit test badge category calculations.
- `BL-052` `[ToDo]`: Test football-data sync with mocked API responses only.
- `BL-053` `[ToDo]`: Add Playwright coverage for admin setup, allocation, shared link, tabs, leaderboard, and stale data states.
- `BL-054` `[ToDo]`: Run security hardening for shared links, admin authorization, RLS, and server-only secrets.
- `BL-055` `[ToDo]`: Run mobile visual polish and accessibility pass.

## Phase 7 - Optional Enhancements

- `BL-056` `[ToDo]`: Add MVP AI sweepstake updates.
- `BL-057` `[ToDo]`: Add MVP AI match summaries.
- `BL-058` `[ToDo]`: Add MVP AI leaderboard banter.
- `BL-059` `[ToDo]`: Add MVP participant email updates.
- `BL-060` `[ToDo]`: Add Golden Boot Team if reliable data source is confirmed.
- `BL-061` `[ToDo]`: Add Golden Glove Team if reliable data source is confirmed.
- `BL-062` `[PostMVP]`: Add admin scoring customization.
- `BL-063` `[ToDo]`: Add private passcode-protected sweepstakes if not included in MVP.

## Done

- `BL-064` `[Done]`: Create planning workspace.
- `BL-065` `[Done]`: Strengthen root `AGENTS.md`.
- `BL-066` `[Done]`: Run initial agent setup and planning pass.
- `BL-067` `[Done]`: Pivot planning scope to sweepstake app.
- `BL-068` `[Done]`: Replace backlog with phased MVP sweepstake backlog.
