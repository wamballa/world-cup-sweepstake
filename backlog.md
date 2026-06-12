# Backlog

Use unique IDs when discussing work items. Keep IDs stable once created. Move items between status sections rather than renumbering.

This backlog is for a World Cup 2026 sweepstake app. Admins create sweepstakes, add participants, randomly allocate World Cup teams, share a link, and track participant standings based on team performance.

This file is the single source of truth for work item IDs and implementation status. `AGENTS.md` contains operating rules only and must not duplicate this list.

## To Do

- `BL-110` `[ToDo]`: Add proactive football-data sync operations monitoring beyond the existing persisted run logs and participant freshness labels, including detection and notification for missed scheduled runs, repeated failures, and stale tournament data.
- `BL-094` `[ToDo]`: Add real participant shared-board search/filter behavior if retained from the BL-091 header concept, including participant and team search, mobile-friendly results or filtering, keyboard accessibility, empty results state, and Playwright coverage for finding a participant and an allocated team.
- `BL-095` `[ToDo]`: Apply the approved BL-091 visual direction to the admin experience after the participant shared board is updated, including create/setup, participant management, allocation review, share-link, archive/delete, empty/error/loading states, and Playwright coverage for the critical mobile admin flow.
- `BL-083` `[ToDo]`: Add an optional fairness-weighted allocation mode alongside pure random allocation, ideally using pre-tournament team strength or odds data from an approved server-side source, including data-source selection and licensing checks, normalized team strength storage, deterministic/testable weighted allocation that balances strong/weak teams across participants, clear admin mode controls, audit metadata showing the allocation mode used, and unit/Playwright coverage proving no participant receives a systematically unfair team-strength advantage.
- `BL-084` `[ToDo]`: Add tournament team-list change detection, notification, and reallocation workflow, including storing team sync snapshots/checksums, detecting added/removed/replaced teams after football-data.org sync, flagging affected sweepstakes whose saved allocations reference changed teams, notifying admins and opted-in participants that the team list changed, disabling stale shared boards or marking them as pending review, providing an owner-only re-roll/repair allocation flow, recording audit events for team-list changes and re-rolls, and testing scenarios where a team is removed or the total team count changes after allocations already exist.
- `BL-056` `[ToDo]`: Add MVP AI sweepstake updates.
- `BL-057` `[ToDo]`: Add MVP AI match summaries.
- `BL-058` `[ToDo]`: Add MVP AI leaderboard banter.
- `BL-059` `[ToDo]`: Add MVP participant email updates.
- `BL-060` `[ToDo]`: Add Golden Boot Team if reliable data source is confirmed.
- `BL-061` `[ToDo]`: Add Golden Glove Team if reliable data source is confirmed.
- `BL-062` `[PostMVP]`: Add admin scoring customization.
- `BL-063` `[ToDo]`: Add private passcode-protected sweepstakes if not included in MVP.

## WIP

No active WIP items.

## Done

- `BL-108` `[Done]` `[Urgent]` `[Bug]`: Replace the inadequate daily World Cup sync with authenticated Vercel Pro matchday polling every 30 minutes, retaining the central server-side football-data.org cache and recalculation flow, respecting the provider's 10 requests/minute limit, preserving sync audit records, and adding a configuration contract test for the production schedule.
- `BL-109` `[Done]` `[Bug]`: Replace participant-facing use of `Final` as a completed-match status with `Completed`, while retaining the internal `final` match status for persistence and scoring, preserving `Final` for the actual tournament stage, updating summary and stats copy, and preventing AI sweepstake updates from describing ordinary completed matches as "finals".
- `BL-107` `[Done]` `[Bug]`: Make the countdown hero kickoff date formatting deterministic across Vercel server rendering and browser hydration by using the intended tournament display timezone, preventing production-only React text mismatch warnings.
- `BL-106` `[Done]` `[Bug]`: Fix the countdown page header metric so it shows total cached tournament matches instead of the number of allocated teams with first-match fixtures, avoiding misleading `48 fixtures` copy for the 104-match World Cup 2026 format.
- `BL-102` `[Done]` `[Bug]`: Remove the explanatory sentence from the countdown hero panel: "Same shared link, pre-tournament mode. Allocations and first fixtures are grounded in cached sweepstake data." Keep the countdown page visually clean while preserving useful freshness/status labels elsewhere.
- `BL-105` `[Done]`: Cache country flag assets for countdown country panels without browser calls to football-data.org, including team flag source URL storage, one-off server-side copying to a public Supabase Storage bucket, cached `flag_asset_path` exposure through shared-board data, and subtle flag backgrounds on countdown country blocks with readable overlays.
- `BL-104` `[Done]` `[Bug]`: Remove the duplicated three-letter country-code lozenges from the top of each participant card on the countdown page, keeping the code only alongside the relevant country block to save space and reduce repetition.
- `BL-103` `[Done]`: Change the countdown page allocations section from one card per country to one card per participant, showing each person's allocated country or countries with the relevant first-match kickoff, opponent team, and participant matchup.
- `BL-101` `[Done]`: Add an admin-controlled shared-link countdown mode after a draw has been made, preserving the existing participant page and `/s/[shareToken]` URL while allowing admins to toggle the shared link between the participant board and a new countdown page. The countdown page shows a prominent tournament-start countdown plus team allocations, each allocated team's first cached match, opponent team, and participant matchup, with all football details grounded in cached server data and no browser calls to football-data.org.
- `BL-100` `[Done]`: Improve the participant shared-board AI commentary so it feels shorter, punchier, and more genuinely useful while staying grounded only in cached sweepstake data. Explore a compact format with one headline, 3-4 high-signal bullets, lighter repetition around cache/freshness notes, clearer "what changed" language, participant/team callouts that avoid piling on one person, and a friendly office-safe tone. Acceptance should include prompt/test updates proving the output does not invent football facts, does not imply live data when the cache is stale or awaiting first sync, keeps freshness disclosure visible but concise, and remains readable on mobile.
- `BL-099` `[Done]` `[Bug]`: Fix participant shared-board Teams and Matches table headings so they are visible without hover, using a high-contrast grey campaign header background with white heading text while preserving the existing tab layout and mobile table behavior.

- `BL-098` `[Done]`: Add football-data.org validation mode using configured tournament datasets, including `WC_2026` plus the free-tier-accessible completed `PL_2024` validation dataset, admin controls to change a sweepstake's tournament dataset, a required confirmation that changing dataset resets existing allocations and derived scores, clearing that sweepstake's team allocations, participant scores, team scores, badge holders, and relevant AI/email cached outputs after a dataset change, reusing the fair draw flow against the selected dataset's cached teams, syncing and caching teams, matches, stats, freshness, and final results per tournament dataset, recalculating participants, Teams, Badges, Matches, and Stats from the selected validation dataset, audit logging the dataset change and reset, and unit/Playwright coverage proving a completed competition can be drawn and shown correctly without hitting football-data.org from the browser.
- `BL-097` `[Done]`: Add a lightweight bulk participant paste box under the existing admin Add participant form, allowing admins to paste comma-separated names, preview or validate parsed participant names, and add all valid new participants to Supabase in one action while preserving existing allocations, duplicate-name validation, immediate-save behavior, mobile usability, and Playwright coverage for bulk adding, duplicate handling, reload persistence, and post-draw allocation preservation.
- `BL-096` `[Done]`: Replace the temporary `WC` campaign logo mark with the provided 64x64 app logo asset through the reusable `CampaignLogoMark` slot on the participant shared board and BL-091 prototype.
- `BL-093` `[Done]`: Apply the approved BL-091 visual direction to the real participant shared-board route while preserving existing server data, tabs, auth boundaries, freshness labels, no-email-leak behavior, and current shared-link functionality; map the prototype's Players, Teams, and Updates affordances onto existing participant/team/update surfaces without adding unsupported behavior.
- `BL-092` `[Done]`: Convert the approved BL-091 visual direction into reusable app styling foundations, including Tailwind/theme tokens or local constants for the purple/magenta/cyan/yellow palette, shared campaign panel/card/header primitives, logo slot handling for the future app mark, mobile-safe spacing/radius rules, and visual regression checks that prevent horizontal overflow.
- `BL-091` `[Done]`: Define and apply an original high-energy shared-board design spike inspired only by the attached retail promo energy, using bold purple and magenta accents, rounded promotional panels, playful tournament graphics, dense mobile-first content blocks, punchy hierarchy, a review-only `/design/bl-091` prototype route backed by preview data, and explicit avoidance of Currys branding, logo, copy, proprietary layout, or direct brand references.
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
- `BL-011` `[Done]`: Scaffold Next.js App Router project when explicitly approved.
- `BL-012` `[Done]`: Configure TypeScript, Tailwind CSS, shadcn/ui, Motion, Vitest, and Playwright.
- `BL-013` `[Done]`: Create base mobile-first layout, navigation, and visual tokens.
- `BL-014` `[Done]`: Create shared UI primitives for buttons, forms, tabs, cards, dialogs, and status labels.
- `BL-015` `[Done]`: Add mock World Cup 2026 team, match, participant, badge, and scoring data.
- `BL-016` `[Done]`: Build admin create-sweepstake flow.
- `BL-017` `[Done]`: Add sweepstake name and tournament settings.
- `BL-018` `[Done]`: Build badge category display settings.
- `BL-019` `[Done]`: Build participant name entry for bulk office/group setup.
- `BL-020` `[Done]`: Add participant email capture field for MVP email updates.
- `BL-021` `[Done]`: Add other-admin management.
- `BL-022` `[Done]`: Implement fair random allocation of all 48 teams.
- `BL-023` `[Done]`: Add allocation review and confirmation state.
- `BL-024` `[Done]`: Generate shared sweepstake link.
- `BL-025` `[Done]`: Implement default team performance scoring.
- `BL-026` `[Done]`: Calculate participant totals from allocated teams.
- `BL-027` `[Done]`: Build participant leaderboard with tie handling.
- `BL-028` `[Done]`: Build Participants tab.
- `BL-029` `[Done]`: Build Teams tab.
- `BL-030` `[Done]`: Build Badges tab.
- `BL-031` `[Done]`: Build Matches tab.
- `BL-032` `[Done]`: Build Stats tab.
- `BL-033` `[Done]`: Calculate MVP badge holders: 1st, 2nd, 3rd, 4th, Wooden Spoon, First Knocked Out, Most Goals Conceded, Fewest Goals Scored, and Most Cards when reliable card data is present.
- `BL-034` `[Done]`: Mark Most Cards, Golden Boot Team, and Golden Glove Team as manual/future on the free tier.
- `BL-035` `[Done]`: Create Supabase schema for sweepstakes, admins, participants, badge categories, teams, allocations, matches, scores, badge holders, and sync logs.
- `BL-036` `[Done]`: Configure Supabase Auth for admins.
- `BL-037` `[Done]`: Implement RLS and server-side authorization for admin-only actions.
- `BL-038` `[Done]`: Persist sweepstake setup, participants, badge categories, allocations, and shared-link access.
- `BL-039` `[Done]`: Persist team scores, participant scores, and badge holders.
- `BL-040` `[Done]`: Protect participant email data separately from display names.
- `BL-041` `[Done]`: Implement server-side football-data.org client.
- `BL-042` `[Done]`: Implement central polling/sync job.
- `BL-043` `[Done]`: Cache teams, fixtures, match status, scores, tables, and team stats in Supabase.
- `BL-044` `[Done]`: Store sync logs and last successful sync time.
- `BL-045` `[Done]`: Add stale, delayed, final, and update-pending data states.
- `BL-046` `[Done]`: Recalculate team scores, participant totals, and badge holders after sync.
- `BL-047` `[Done]`: Preserve upgrade path for live scores without changing frontend data access.
- `BL-048` `[Done]`: Unit test fair allocation across even and uneven participant counts.
- `BL-049` `[Done]`: Unit test team performance scoring.
- `BL-050` `[Done]`: Unit test participant totals and leaderboard tie handling.
- `BL-051` `[Done]`: Unit test badge category calculations.
- `BL-052` `[Done]`: Test football-data sync with mocked API responses only.
- `BL-053` `[Done]`: Add Playwright coverage for admin setup, allocation, shared link, tabs, leaderboard, and stale data states.
- `BL-054` `[Done]`: Run security hardening for shared links, admin authorization, RLS, and server-only secrets.
- `BL-055` `[Done]`: Run mobile visual polish and accessibility pass.
- `BL-064` `[Done]`: Create planning workspace.
- `BL-065` `[Done]`: Strengthen root `AGENTS.md`.
- `BL-066` `[Done]`: Run initial agent setup and planning pass.
- `BL-067` `[Done]`: Pivot planning scope to sweepstake app.
- `BL-068` `[Done]`: Replace backlog with phased MVP sweepstake backlog.
- `BL-069` `[Done]`: Add admin allocation reset and manual team move controls.
- `BL-070` `[Done]`: Persist allocation audit metadata for random reruns and manual team moves.
- `BL-071` `[Done]`: Implement mock-data UI with admin setup, fair allocation review, share-link preview, and read-only scoreboard tabs using fictional local data.
- `BL-072` `[Done]`: Record mock-data UI decision in `/planning/decision-log.md`.
- `BL-073` `[Done]`: Implement backlog Phase 5 football-data.org sync foundation, Supabase cache writes, sync run/state logging, score recalculation, protected cron route, and mocked API tests.
- `BL-074` `[Done]`: Split the current single long mock page into a clearer app structure for admin setup, allocation review, shared board, and tabbed participant views.
- `BL-075` `[Done]`: Add participant-facing view for a sweepstake member to see their allocated teams, total points, badge/prize status, upcoming/recent matches, and optional email update status.
- `BL-076` `[Done]`: Deploy the app to Vercel and configure/verify the Vercel Cron schedule for `/api/cron/football-data-sync`, including required environment variables and cron execution checks.
- `BL-077` `[Done]`: Add admin login and logout flow using Supabase Auth, including protected admin routes, signed-out redirect, visible signed-in admin state, logout action, and Playwright coverage for login-required admin access.
- `BL-078` `[Done]`: Persist account-scoped team allocations using real Supabase team UUIDs instead of fictional mock team IDs, including loading cached World Cup teams from Supabase for the admin draw, saving initial draws/reruns/manual moves to `team_allocations`, writing `allocation_audit_events` with the signed-in admin user id, reloading saved allocations on `/admin`, and keeping allocation data isolated by `sweepstake_admins` authorization and RLS.
- `BL-079` `[Done]`: Replace mock participant management with Supabase-backed participant CRUD, including add, edit, and delete participant controls, participant email persistence, duplicate-name validation, account-scoped authorization, reload persistence, and Playwright coverage that verifies participants persist after reload and do not appear for another admin account.
- `BL-080` `[Done]`: Add owner-only sweepstake archive/delete flow, including confirmation UI, shared-link deactivation, server-side authorization, cascade or soft-delete behavior for participants, emails, allocations, scores, badges, audit data, AI generations, and email logs, plus Playwright coverage verifying archived/deleted sweepstakes disappear from the admin dashboard and can no longer be accessed through the shared link.
- `BL-081` `[Done]`: Remove bulk participant import from the admin Participants tab, leaving only immediate Supabase-backed add, edit, and delete controls, and update Playwright coverage and participant empty states accordingly.
- `BL-082` `[Done]`: Make the admin area derive the actual tournament teams and team count dynamically from the server-side football-data.org sync cache instead of hard-coded UI copy or fixed `48` assumptions, including fetching the real `WC_2026` teams from football-data.org server-side, upserting them into Supabase `teams`, loading the cached team rows/count in `/admin`, updating participant capacity labels, allocation readiness, fair-split messaging, and Playwright/unit coverage for tournaments whose synced team list or count changes.
- `BL-085` `[Done]`: Preserve existing team allocations when admins add or edit participants after a draw, so late entrants do not automatically force a rerun; require explicit manual team moves or an explicit rerun to change the draw.
- `BL-086` `[Done]`: Fix admin participant name edits so renames persist after refresh using targeted Supabase participant create/update/delete actions, explicit Save or Enter controls, duplicate-name validation, allocation-preserving updates by participant UUID, and regression coverage for reload persistence and post-draw allocation preservation.
- `BL-087` `[Done]`: Replace the participant shared-board mock data with real sweepstake-scoped Supabase data so each `/s/[shareToken]` page shows that sweepstake's participants, allocations, cached team scores, leaderboard, badges, matches, stats, and freshness state, with no football-data.org browser calls and no participant email leakage.
- `BL-088` `[Done]`: Make participant-facing Participants and Teams tabs fully server DTO-driven, including all allocated team chips in participant rows, allocated participant names on the Teams tab, all cached tournament teams, hidden empty group columns, plain-language goal columns, and no client-side mock fallback for real shared links.
- `BL-089` `[Done]`: Clean participant-facing Badges, Matches, and Stats tabs so disabled manual/future badge ideas are hidden, badges wait for real final results, stats show cached tournament metrics only, and match rows include server-derived participant names for the two allocated teams.
- `BL-090` `[Done]`: Sort participant-facing matches by cached kickoff date ascending with unscheduled fixtures last, using football-data.org `utcDate` cached in Supabase rather than mock dates for real shared links, with regression coverage for match ordering.
