# Build Phases

## Current Phase Map

The root `AGENTS.md` delivery phases are canonical for agent work. Under that map, phase 3 is **Tech decision lock**.

This file also keeps the older implementation phase map below for build sequencing after the decision lock. To avoid confusion, implementation phase 0 below roughly covers root phases 1 to 3, and implementation phase 1 begins at root phase 4.

## Root Delivery Phases

1. Workspace setup
2. Agent planning
3. Tech decision lock
4. App scaffold
5. Mock-data UI
6. Supabase schema and auth
7. Sweepstake creation and fair team allocation
8. Participant leaderboard and badge tracking
9. football-data.org sync
10. AI features
11. Visual polish
12. Testing and hardening

## Implementation Phase Detail

## Phase 0: Planning Workspace

- Create docs, agent briefs, planning files, and reusable prompts.
- Confirm MVP scope and unresolved decisions.
- Do not create the application yet.

## Phase 1: App Skeleton

- Create Next.js App Router project.
- Add TypeScript, Tailwind CSS, shadcn/ui, test tooling, and baseline layout.
- Establish environment variable structure.

## Phase 2: Core Data Model

- Design Supabase schema for admins, sweepstakes, participants, teams, allocations, matches, scoring, badges, sync logs, AI generations, and email logs.
- Add migrations and seed data.
- Write tests for allocation, scoring, badge calculations, and leaderboards.

## Phase 3: Mock-Data Sweepstake MVP

- Build admin sweepstake setup.
- Build participant entry and optional email capture.
- Build fair team allocation using mock World Cup teams.
- Build shared sweepstake view with Participants, Teams, Badges, Matches, and Stats tabs.

## Phase 4: Football Data Sync

- Add backend sync job for `football-data.org`.
- Cache fixtures, match status, scores, tables, and team stats in Supabase.
- Add monitoring and failure handling.

## Phase 5: Scoring, Badges, And Updates

- Calculate team scores from cached football data.
- Calculate participant totals from allocated teams.
- Calculate badge holders.
- Add email updates.

## Phase 6: AI Experience

- Add match summaries.
- Add leaderboard banter.
- Add sweepstake updates.

## Phase 7: Polish And Launch Readiness

- Improve mobile performance and transitions.
- Add Playwright coverage for critical flows.
- Finalize security checks, rate limits, and production deployment.
