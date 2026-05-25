# Decision Log

## 2026-05-24: Shared Link Countdown Mode

Decision: Add a sweepstake-level `shared_view_mode` so the existing `/s/[shareToken]` URL can switch between the current participant board and a new countdown page after a draw exists. The countdown page uses the same cached shared-board data contract, derives the tournament countdown from the earliest cached kickoff where available, falls back to the configured World Cup 2026 start date only when needed, and shows allocations with each team's first cached match, opponent team, and participant matchup.

Reason: Admins need a pre-tournament holding view without issuing a second link or changing the participant board. Keeping the switch as an admin-only sweepstake setting preserves the existing shared-link security model, avoids browser calls to football-data.org, and keeps allocations and first-match details grounded in cached app data.

## 2026-05-23: BL-098 Historical Tournament Validation Mode

Decision: Add configured football-data.org validation datasets for admin validation, starting with `WC_2026` and `PL_2024`. Admins can change a sweepstake's tournament dataset from Settings after a destructive confirmation; the change preserves participants and admins but clears allocations, team scores, participant scores, badge holders, AI generations, and email update logs, returns the sweepstake to draft, and records a reset audit event as `rerun` with `metadata.actionKind = "tournament_reset"`.

Reason: The current football-data.org free token rejected historical World Cup seasons with 403, while the completed Premier League 2024/25 dataset is available on the free tier. That gives the team a completed 20-team validation dataset for allocation, scoring, badge, matches, and stats behavior before the upcoming 2026 tournament. Football-data.org team and match external IDs can repeat across seasons and competitions, so cache uniqueness must be scoped by `tournament_code`.

## 2026-05-22: BL-097 Bulk Participant Paste Entry

Decision: Reintroduce bulk participant entry as a lightweight paste helper under the existing Add participant form, accepting names only and saving new participants immediately through Supabase.

Reason: Admins need a fast way to add office/group lists without returning to the older multi-state bulk import/manual-save flow removed by `BL-081`. The one-by-one add and inline edit model remains the source of truth, and added late participants must preserve existing allocations.

## 2026-05-22: BL-096 Campaign Logo Asset

Decision: Copy the provided 64x64 logo asset into `public/brand/logo1-web.png` and use it through `CampaignLogoMark` on the production participant shared board and BL-091 prototype instead of the temporary `WC` initials.

Reason: The approved visual direction already established `CampaignLogoMark` as the reusable replacement point for the future logo. Serving the image from `public/brand` keeps the asset stable for Next.js static delivery and avoids one-off logo styling on individual pages.

## 2026-05-22: BL-093 Participant Shared Board Visual Rollout

Decision: Apply the approved BL-091 campaign visual direction to the real participant shared-board route by wrapping `/s/[shareToken]` in the reusable campaign shell, header, logo slot, panels, metrics, pills, and high-energy colour tokens from BL-092. Keep the existing server-loaded shared-board DTO, participant identity picker, Radix tabs, shared-link access, freshness labels, email-update status wording, badge awaiting-results behavior, and no-email-leak data contract unchanged.

Reason: The production participant board should now match the approved high-energy direction while avoiding new unsupported behavior. Prototype affordances are mapped to real surfaces as participant/team counts, freshness/update status, leaderboard, teams, badges, matches, and stats; search/filter remains deferred to BL-094.

## 2026-05-22: BL-091 Shared Board Visual Direction Spike

Decision: Add a review-only shared-board design prototype for `BL-091` that uses existing preview data and explores a high-energy visual direction with bold purple/magenta accents, rounded promo-style panels, playful tournament campaign blocks, dense mobile-first content, and punchy hierarchy.

Reason: The product needs a concrete visual artifact for review and iteration while preserving the live shared-link experience. The direction may borrow broad energy from the supplied retail reference but must remain original, with no Currys logo, copy, proprietary layout, or direct brand reference.

Update: The BL-091 prototype direction is approved as the visual direction to carry into production pages. Capture the direction in `/docs/bl-091-visual-direction.md`, make root and UX agent guidance point to it, mark `BL-091` done, and sequence rollout through reusable styling foundations, real shared-board application, optional search/filter functionality, and admin experience refresh tickets.

## 2026-05-22: BL-092 Campaign Styling Foundations

Decision: Convert the approved BL-091 visual language into reusable campaign tokens and primitives before applying it to production pages. Add campaign palette tokens in `src/app/globals.css`, shared campaign layout/header/logo/panel/row/metric primitives in `src/components/campaign.tsx`, refactor the BL-091 prototype to consume those primitives, and add Playwright coverage for mobile-safe horizontal overflow.

Reason: The approved look and feel should be reusable and testable rather than copied through hard-coded colours and one-off markup. The foundation keeps the future logo slot, shape language, palette, dense mobile rows, and overflow checks available for BL-093 and BL-095.

## 2026-05-21: Preserve Draws For Late Participants

Decision: Adding or editing participants after a draw must not automatically rerun, clear, or replace existing team allocations. Late entrants can be added without changing the shared board; they receive no teams until an admin explicitly uses manual team moves or reruns the draw. Deleting a participant can remove only that participant's allocations through the participant relationship, while all other allocations remain intact.

Reason: A late entry should not force a confusing new draw for participants who have already seen their teams. Allocation changes must remain deliberate admin actions.

## 2026-05-21: BL-076 Vercel Cron Schedule

Decision: Configure Vercel Cron in `/vercel.json` to call `/api/cron/football-data-sync` daily at 06:00 UTC. Protect the route with Vercel's `CRON_SECRET` authorization convention, keep `FOOTBALL_DATA_SYNC_SECRET` as a local/manual fallback, and document the required production environment variables in `README.md`.

Reason: The MVP is designed around delayed free-tier football-data.org scores, Vercel Hobby cron allows daily jobs, and a daily scheduled sync gives production a safe baseline without exceeding the free-tier 10 calls/minute football-data.org limit.

Update: Deployed production to `https://world-cup-sweepstake-rouge.vercel.app`, configured the required production Supabase and football-data sync environment variables, and verified `/api/cron/football-data-sync` with a bearer-authenticated `GET`. The verification returned `200` with 48 teams, 104 matches, 153 records changed, and 1 sweepstake recalculated; Vercel logs showed the route invocation as `200`.

## 2026-05-20: BL-077 Admin Login And Logout

Decision: Add email/password Supabase Auth for admins using cookie-based SSR helpers, protect `/admin`, redirect signed-out admins to `/login?next=/admin`, show signed-in admin identity in the admin shell, and provide a server-side logout route. Playwright auth coverage uses hosted Supabase credentials from `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, skipping only that auth journey when credentials are not configured.

Reason: Admin mutations and setup controls need a real authenticated surface before further production hardening, while hosted credential configuration keeps the app aligned with the intended Supabase deployment target without requiring public signup in the MVP.

Update: Add a public `/signup` page for creating Supabase admin accounts and an `/auth/callback` route so email-confirmation links can establish the browser session before redirecting to `/admin`.

Update: Wire the admin dashboard to account-scoped Supabase data. `/admin` now lists only sweepstakes visible through the signed-in user's `sweepstake_admins` membership, new sweepstakes create an owner row for the current user, and participant/settings saves write rows under that sweepstake id so admin data cannot cross accounts.

## 2026-05-20: BL-078 Account-Scoped Allocation Persistence

Decision: Replace admin allocation preview team ids with cached Supabase `teams.id` values for `WC_2026`. Admin draw, rerun, and manual move actions now save `team_allocations` rows and `allocation_audit_events` using the signed-in admin id, and `/admin` reloads saved allocations and audit history only through the current user's RLS-authorized sweepstakes.

Reason: Allocation data must use real database foreign keys and account-scoped authorization so participant/team assignments persist after reload and cannot cross between admin accounts.

## 2026-05-20: BL-079 Supabase Participant Management

Decision: Replace admin participant mock/default state with account-scoped Supabase participant management. The admin Participants tab now starts empty for new sweepstakes, supports add, bulk import, inline edit, delete, duplicate-name checks, participant email editing, and save-to-Supabase behavior that returns real participant UUIDs before allocation can run.

Reason: Participant data must belong to the signed-in admin's sweepstake and persist through reloads. Requiring saved participants before allocation prevents `team_allocations` from referencing client-only draft ids.

## 2026-05-20: BL-080 Owner Archive Flow

Decision: Implement sweepstake removal as owner-only soft archive by setting `sweepstakes.status` to `archived`. Archived sweepstakes are hidden from `/admin`, real shared links are served only when `get_sweepstake_by_share_token` returns a `shared` sweepstake, and saved allocations promote a sweepstake to `shared` so archive deactivates an actually usable participant link.

Reason: Soft archive preserves participants, emails, allocations, badges, audit data, and future logs while giving admins a reversible data-retention path and immediately removing access from the owner dashboard and public shared route.

## 2026-05-20: BL-081 Participant Entry Simplification

Decision: Remove bulk participant import and the manual participant save button from the admin Participants tab. Admins now add one participant at a time, delete directly, and save inline name/email edits on blur, with each change writing through the Supabase participant save action.

Reason: Once participant add/delete/edit became account-backed and immediate, the bulk/manual save path created confusing duplicate states. A single immediate CRUD model is easier to understand and keeps allocation working only from persisted participant UUIDs.

## 2026-05-20: BL-082 Dynamic Football Team Count

Decision: Keep football-data.org usage inside the central server sync. The sync fetches real `WC_2026` teams and matches server-side, upserts teams into Supabase, and `/admin` derives team count, participant capacity labels, fair split, and allocation notes from cached `teams` rows. Add a one-minute sync cooldown before creating the football-data.org client so repeated cron/manual calls do not burn through the free-plan 10 requests/minute limit.

Reason: Admin pages must never call football-data.org per user view. Cache-first team counts let the app adapt if the synced team list changes while keeping rate-limit protection, tests, and allocation logic deterministic.

## 2026-05-20: Backlog Phase 6 Testing And Hardening

Decision: Complete backlog Phase 6 by expanding fair-allocation unit coverage across even, uneven, and over-subscribed participant counts; adding Playwright journeys for admin setup, allocation, shared-link preview, scoreboard tabs, leaderboard, and stale data states on mobile and desktop; and tightening shared-link/security contracts.

Reason: Allocation fairness, read-only participant access, protected server operations, and mobile tab accessibility are release-critical trust surfaces for the sweepstake MVP.

## 2026-05-20: BL-074 Mock Page Structure Split

Decision: Split the long mock app shell into a thin coordinator plus feature-level components for admin setup, allocation/share review, shared scoreboard tabs, demo helpers, and shared UI primitives.

Reason: The mock experience had grown large enough that future feature work would be harder to review safely. Separating page state from section rendering keeps the admin and participant surfaces easier to maintain without changing behavior.

## 2026-05-20: BL-075 Participant-Facing Sweepstake View

Decision: Add a participant-focused card to the shared scoreboard Participants tab using grounded mock data for the member's allocated teams, rank, total points, current badge status, recent/upcoming matches, and email update state.

Reason: Participants need an immediate personal answer after opening the shared board: which teams they have, how they are doing, what badges matter, which matches affect them, and whether email updates are enabled.

## 2026-05-20: Separate Admin And Participant Routes

Decision: Keep the admin setup/allocation demo on `/` and move the participant-only shared board to `/s/[shareToken]`. Use a participant name picker saved in `localStorage` per share token for lightweight "Your sweepstake" personalization.

Reason: Shared participant links must not expose admin controls, and MVP participant identity should stay low-friction without adding login, email verification, or per-participant link management.

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

## 2026-05-19: Legacy Tech Decision Lock

Decision: Lock the technical direction in `/docs/tech-decisions.md`: Next.js App Router with TypeScript, Tailwind CSS v4, shadcn/ui, Motion, Supabase Postgres/Auth/Realtime/RLS, server-only football-data.org sync, server-only OpenAI generation, Vitest, Playwright, Vercel hosting, and Vercel Cron. Also lock the main runtime boundaries, route boundaries, module structure, database table plan, server-only secrets rule, and test expectations.

Reason: Locking these decisions reduces drift, keeps future implementation small and reviewable, and preserves the product rules around server-side data access, recalculable scoring, and protected admin operations.

Superseded by: `2026-05-19: Backlog Is The Single Phase Source`. This decision remains valid as a technical lock, but it is no longer a phase-status source.

## 2026-05-19: Legacy Phase Numbering Clarification

Decision: Clarify that older phase numbering was superseded once `/backlog.md` became the only phase and status source.

Reason: The workspace had two phase maps with different numbering, which could cause the project to jump into feature implementation too early.

Superseded by: `2026-05-19: Backlog Is The Single Phase Source`.

## 2026-05-19: Phase 4 App Scaffold Complete

Decision: Complete canonical root phase 4 and treat the existing Next.js App Router scaffold as the baseline app scaffold. Confirm TypeScript, Tailwind CSS v4, shadcn/ui primitives, Motion, Vitest, Playwright, `src/` layout, `@/*` import alias, README status, and `.env.example` as the scaffold completion surface.

Reason: The tech decisions were locked, and scaffold work needed to formalize the application shell and tooling before further feature build work continued.

Superseded by: `2026-05-19: Backlog Is The Single Phase Source`. This work maps to backlog Phase 1.

## 2026-05-19: Phase 5 Mock-Data UI

Decision: Implement the canonical phase 5 mock-data UI as a local-state admin setup, fair allocation review, share-link preview, and read-only participant scoreboard with Participants, Teams, Badges, Matches, and Stats tabs. Keep all football teams, scores, badges, matches, and standings powered by typed fictional mock data only.

Reason: Phase 5 should validate the product experience before Supabase, Auth, football-data.org sync, email delivery, and AI features are wired in. Fictional mock data prevents the UI from implying unofficial World Cup facts are real.

Superseded by: `2026-05-19: Backlog Is The Single Phase Source`. This work maps to backlog Phase 2 mock-complete setup and backlog Phase 3 mock-complete scoreboard tabs.

## 2026-05-19: Backlog Phase 5 Football Data Sync

Decision: Implement backlog Phase 5 as a server-only football-data.org integration. Add a server-side client for the World Cup 2026 teams and matches endpoints, normalize API statuses into app cache states, cache teams, matches, and team match stats in Supabase, write sync run/state records, recalculate sweepstake scores and badge holders after successful syncs, and expose a protected `/api/cron/football-data-sync` route for Vercel Cron.

Reason: `/backlog.md` is now the single source of truth for phase sequencing, and its Phase 5 is Football Data Integration. The frontend must never call football-data.org, sync attempts must be observable, and API sync logic must be testable without real credentials or network calls.

## 2026-05-19: Backlog Is The Single Phase Source

Decision: Make `/backlog.md` the only source of truth for phase sequencing, work item IDs, and implementation status. Remove the duplicate delivery phase list from `AGENTS.md`, update `AGENTS.md` to operating rules only, and update phase references in `/docs/build-phases.md` and `README.md`.

Reason: Maintaining phase lists in both `AGENTS.md` and `/backlog.md` caused conflicting phase numbers and unclear status. A single backlog prevents drift.

## 2026-05-19: Agents Use Backlog For Work Status

Decision: Add `/backlog.md` to every role-specific agent input list and rule set as the only source of truth for phase sequencing, work item IDs, and implementation status.

Reason: All agents need the same work-status source so phase checks use the backlog and do not revive older phase numbering from planning documents.

## 2026-05-19: Backlog Phase 4 Supabase Persistence

Decision: Add the Phase 4 Supabase persistence foundation: SQL migration for core tables, Auth profile trigger, admin RLS policies, shared-link lookup function, protected participant email storage, allocation audit events, lazy server-side Supabase clients, admin authorization helper, and server persistence helpers for setup, allocations, team scores, participant scores, and badge holders.

Reason: The app needs a durable and testable persistence contract before football-data.org sync and real scoring can be wired in. Keeping participant emails in a separate table and all privileged clients under `src/server` preserves the security rules around shared links and server-only secrets.

## 2026-05-19: Backlog Phase 3 Complete

Decision: Complete backlog Phase 3 by adding deterministic scoring and badge logic under `src/features/scoring`, wiring mock standings and badges to those calculations, and marking `BL-025` through `BL-033` as done. `Most Cards` remains marked manual/future in the UI on the free football-data.org tier, but the calculation supports it when reliable card data is present.

Reason: Leaderboards, participant totals, team scores, and badge holders must be recalculable from cached app data and testable without AI or external API calls.
