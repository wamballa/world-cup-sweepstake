# Decision Log

## 2026-05-19: GitHub Version Control

Decision: Use Git and GitHub as the source-control workflow for the project, with local checkpoint commits before or after meaningful update batches.

Reason: The app is growing beyond the scaffold stage, and commits provide reviewable history plus a rollback path if future changes introduce regressions.

## 2026-05-19: Product Pivot To Sweepstake

Decision: Pivot from the old match-score game concept to a World Cup 2026 sweepstake app.

Reason: The corrected product is a simpler, lower-friction sweepstake experience based on random team allocation and automatic scoring, not user-entered match scores.

## 2026-05-19: No Prediction Features

Decision: Remove user-entered match scores, match-score entry screens, entry cutoffs, old match-score scoring, and entry locks from the product scope.

Reason: The core mechanic is team allocation and tournament performance tracking.

## 2026-05-19: Fair Team Allocation

Decision: All 48 World Cup teams must be allocated as evenly as possible across participants. Allocation difference between participants must not exceed one team.

Reason: Sweepstake fairness is central to user trust and must be deterministic enough to test while still using random assignment.

## 2026-05-19: Default Team Performance Scoring

Decision: Provide one fixed MVP scoring model with no admin scoring customization. Scoring is: group stage win 3, group stage draw 1, reach Round of 16 5, reach Quarter-final 8, reach Semi-final 12, runner-up 15, and win the World Cup 25.

Reason: The model is simple to explain, strongly rewards tournament progress, is recalculable from cached match and tournament data, and keeps the friendly office sweepstake easy to trust.

## 2026-05-19: Badge Categories Instead Of Prizes

Decision: The MVP is a friendly office sweepstake with no entry fee, no prize pot, and no physical prize management. Replace prize categories with badge categories shown as icons and/or short text next to participant names as the competition progresses. Supported badge categories are 1st, 2nd, 3rd, 4th, Wooden Spoon, First Knocked Out, Most Goals Conceded, Fewest Goals Scored, Most Cards, Golden Boot Team, and Golden Glove Team.

Reason: The product is for friendly work bragging rights, so lightweight badges fit better than money or prize workflows.

## 2026-05-19: Server-Side Football Data Sync

Decision: The frontend must never call football-data.org. All football-data.org calls happen server-side through central polling and sync jobs, then cache results in Supabase.

Reason: This protects API keys, avoids per-user API calls, controls rate limits, and gives the app one authoritative cached football data source.

## 2026-05-19: football-data.org Free Tier For MVP

Decision: Use football-data.org API v4 on the free tier for MVP. Use FIFA World Cup competition `WC` / `2000`, with `season=2026` where supported. Design for delayed scores, delayed fixtures/schedules, available tables where supported, and a 10 authenticated calls/minute limit. Do not rely on live scores or deep data such as line-ups, substitutions, goal scorers, bookings/cards, or squads.

Reason: The free tier is enough for the fixed MVP scoring model based on group-stage results and tournament progression, while badge categories that require deep data can be marked manual, unavailable, or future.

## 2026-05-19: Vercel Cron For Scheduled Sync

Decision: Use Vercel Cron for scheduled football-data.org sync jobs. Supabase remains the managed database, cache, and persistence layer; Vercel runs scheduled server-side sync execution.

Reason: The project will use a Vercel-hosted Next.js app, so Vercel Cron keeps scheduled sync close to the server-side app code and works cleanly with the existing Vercel account.

## 2026-05-19: Pre-Scaffold Architecture Plan

Decision: Lock the pre-scaffold architecture plan in `/planning/pre-scaffold-architecture-plan.md`.

Reason: Phase 0 requires the build architecture to be agreed before scaffolding so implementation can stay small, reviewable, and aligned with the product, security, football-data, AI, email, and testing rules.

## 2026-05-19: Mobile-First Wireframe Plan

Decision: Lock the low-fidelity mobile-first wireframe plan in `/planning/mobile-wireframe-plan.md`.

Reason: Phase 0 requires screen hierarchy, flows, states, and mobile interaction priorities to be agreed before any UI build or final visual design.

## 2026-05-19: Free-Tier Delayed Scores First

Decision: Design for delayed scores on the football-data.org free tier first, with a later upgrade path to live scores.

Reason: This keeps MVP realistic while preserving a path to better tournament-time freshness.

## 2026-05-19: AI Included In MVP

Decision: Include AI in the MVP for match summaries, leaderboard banter, and sweepstake updates grounded only in cached app data.

Reason: AI is part of the desired MVP experience, but core sweepstake features must remain reliable without it.

## 2026-05-19: Email Updates Included In MVP

Decision: Include email updates in the MVP for participants who provide email addresses.

Reason: Email updates are part of the desired engagement loop for points changes, match results, and prize status changes.

## 2026-05-19: No Passcodes For MVP Shared Links

Decision: Do not require passcodes for MVP shared sweepstake links. Participants receive an unguessable read-only scoreboard link and cannot perform admin actions from that view.

Reason: The participant link only exposes the intended scoreboard experience, keeping access low-friction while admin actions remain protected separately.

## 2026-05-19: Shared Ties For Leaderboards And Badges

Decision: Keep tie handling simple for MVP. Participants with the same points share the same leaderboard rank, and badge categories can have shared holders when the underlying World Cup data produces a tie. Do not invent artificial team-level tie-breakers.

Reason: The app is based on actual tournament data, and shared ties are easier to explain than manufactured tie-break rules. There is no in-app prize splitting or payout handling.

## 2026-05-19: Admins Can Reset Or Edit Allocations

Decision: Admins can rerun random team allocation and can manually move teams between participants. Allocation changes remain admin-only, must keep all 48 teams assigned, and should be logged with audit metadata. The app should warn admins before changing allocations after the scoreboard link has been shared.

Reason: Real group sweepstakes need flexibility for colleagues joining late, corrections, and agreed manual swaps, while audit metadata keeps allocation changes explainable.

## 2026-05-19: Preferred Stack

Decision: Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Motion or Framer Motion, Supabase Postgres/Auth/Realtime, football-data.org, OpenAI API, Vitest, and Playwright.

Reason: This stack supports a polished mobile web app, server-side boundaries, realtime updates, AI features, and testable domain logic.

## 2026-05-19: Phase 1 App Scaffold

Decision: Scaffold the app as a Next.js App Router project with TypeScript, Tailwind CSS v4, shadcn/ui, Motion, Vitest, and Playwright. Use a `src/` directory, `@/*` import alias, shadcn source-owned UI primitives, and Playwright smoke coverage for mobile and desktop.

Reason: This implements the approved Phase 1 scaffold and establishes the baseline app, UI, and test tooling before product feature work begins.

## 2026-05-19: Phase 1 Layout Foundation

Decision: Establish a dark, mobile-first app shell with a sticky header, desktop setup navigation, mobile scoreboard tab navigation, reusable status colors, and base surfaces for admin setup and participant scoreboard entry points.

Reason: Phase 1 requires a polished foundation for the admin and participant journeys before mock data and feature-specific screens are added.

## 2026-05-19: Phase 1 Mock Data

Decision: Add typed mock data under `src/features/mock-data` with 48 fictional tournament teams, 8 mock participants, fair allocations, match freshness states, badge states, and derived participant standings.

Reason: The app needs realistic data shapes for UI and test work before Supabase and football-data.org sync are implemented, while avoiding any claim that mock teams, scores, or fixtures are official World Cup facts.

## 2026-05-19: Phase 3 Tech Decision Lock

Decision: Lock the technical direction in `/docs/tech-decisions.md`: Next.js App Router with TypeScript, Tailwind CSS v4, shadcn/ui, Motion, Supabase Postgres/Auth/Realtime/RLS, server-only football-data.org sync, server-only OpenAI generation, Vitest, Playwright, Vercel hosting, and Vercel Cron. Also lock the main runtime boundaries, route boundaries, module structure, database table plan, server-only secrets rule, and test expectations.

Reason: The root `AGENTS.md` delivery phase 3 requires tech decisions to be settled before further build phases. Locking these decisions reduces drift, keeps future implementation small and reviewable, and preserves the product rules around server-side data access, recalculable scoring, and protected admin operations.

## 2026-05-19: Phase Numbering Clarification

Decision: Treat the delivery phases in `AGENTS.md` as canonical and clarify `/docs/build-phases.md` so phase 3 means Tech decision lock for current agent work. Keep the older implementation phase detail as a lower-level build sequence for later phases.

Reason: The workspace had two phase maps with different numbering, which could cause the project to jump into feature implementation too early.

## 2026-05-19: Phase 4 App Scaffold Started

Decision: Start canonical root phase 4 and treat the existing Next.js App Router scaffold as the baseline app scaffold. Confirm TypeScript, Tailwind CSS v4, shadcn/ui primitives, Motion, Vitest, Playwright, `src/` layout, `@/*` import alias, README status, and `.env.example` as the scaffold completion surface.

Reason: Phase 3 tech decisions are locked, and phase 4 should formalize the application shell and tooling before further feature build work continues.
