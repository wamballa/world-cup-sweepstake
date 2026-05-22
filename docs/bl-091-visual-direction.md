# BL-091 Visual Direction

## Status

Approved as the current visual direction for the World Cup 2026 sweepstake app. The review prototype lives at `/design/bl-091` and uses preview data only. Rollout to production pages must follow `/backlog.md`.

## North Star

The app should feel like a premium, high-energy tournament board for offices, friends, and groups: bold, playful, slick, dense, and immediately useful on mobile. It should have the excitement of a campaign page while still behaving like a practical scoreboard and admin tool.

Use the supplied retail reference only for broad energy: confident colour, chunky hierarchy, rounded promo panels, and dense content blocks. Do not copy Currys branding, logo, copy, proprietary layout, or direct visual identity.

## Palette

- Deep purple: primary brand base, headers, icon discs, strong action surfaces.
- Magenta/red-pink: excitement, hero panels, leaderboard emphasis, key labels.
- Cyan/mint: supporting panels, friendly status areas, lower-pressure information.
- Yellow: celebratory highlights, points pills, badge/watch accents.
- White/off-white/lavender: page background, breathable content surfaces, contrast.

Avoid one-note colour themes. Purple is the anchor, but magenta, cyan, yellow, and white must be visible enough that the app feels bright and social rather than dark or corporate.

## Shape And Layout

- Mobile-first stacked bands are the default.
- Use rounded campaign panels for major content groups: hero, leaderboard, your teams, teams, matches, badges, stats.
- Use circular marks for the app logo, section icons, and compact status anchors.
- Keep dense information scannable with strong labels, compact rows, and clear points/status pills.
- Desktop may expand into two-column or side-by-side layouts, but should not become a heavy admin dashboard or marketing landing page.
- Prevent horizontal overflow on mobile. Long names, team labels, and match rows must truncate or wrap cleanly.

## Typography And Copy

- Use punchy, confident headings for high-value surfaces.
- Use short, plain labels for data and controls.
- Keep body copy functional and friendly. No gambling language, no fake football facts, and no claims of live data unless backed by cached state.
- Header text can feel energetic, but production pages must still prioritize clarity: participant, teams, rank, points, badges, matches, and freshness.

## Component Direction

- Header: circular logo slot on the left, sweepstake name as the dominant first-viewport signal, compact search or navigation affordances only when backed by real behavior or mapped to existing surfaces.
- Leaderboard: large rank discs, points emphasis, team chips, and quick scanning for the current leader.
- Your Teams: personal summary with allocated teams, status, points, and badge watch.
- Teams/Matches: compact rows with owner/participant context and bold status pills.
- Badges: celebratory but honest; show awaiting-results states when cached results do not decide holders.
- Updates: map to freshness, optional email status, and future AI updates. AI must remain grounded in cached app data.

## Reusable Foundations

BL-092 added shared campaign tokens in `src/app/globals.css` and reusable primitives in `src/components/campaign.tsx`.

- Use `bg-campaign-page`, `text-campaign-ink`, `text-campaign-purple-strong`, `bg-campaign-purple`, `bg-campaign-magenta`, `bg-campaign-cyan`, `bg-campaign-yellow`, `bg-campaign-pink`, `bg-campaign-blush`, and related campaign tokens instead of hard-coded hex values.
- Use `CampaignShell`, `CampaignTopStrip`, `CampaignPageStack`, `CampaignHeader`, `CampaignLogoMark`, `CampaignPanel`, `CampaignHeading`, `CampaignSectionHeading`, `CampaignIconDisc`, `CampaignPill`, `CampaignMetric`, and `CampaignCompactRow` when applying the BL-091 direction to real pages.
- `CampaignLogoMark` is the approved slot for replacing the temporary `WC` mark with the future logo.
- The design-foundation Playwright check in `tests/e2e/design-foundations.spec.ts` verifies the prototype has no horizontal overflow on both configured projects.

## Prototype-To-Product Rules

- The BL-091 prototype is not itself product functionality.
- Players, Teams, and Updates in the prototype should map to existing participant, team, and freshness/update surfaces before any new behavior is added.
- Search/filter should be implemented only through a backlog item and must support participant and team lookup accessibly.
- The future logo should replace the temporary `WC` mark through a reusable logo slot, not one-off page styling.
- Keep live shared-link security, server DTOs, no email leakage, and no browser calls to `football-data.org` unchanged.

## Rollout Order

1. Convert the visual language into reusable styling foundations.
2. Apply it to the real participant shared board.
3. Add real search/filter behavior only if retained as a product feature.
4. Apply the direction to the admin experience.
5. Revisit the prototype route once production pages have caught up; remove it or keep it as a design reference based on a later decision.

## Acceptance Checks

- The page feels recognizably aligned with the BL-091 prototype.
- It is original and contains no Currys or Playdrawr branding, copy, proprietary layout, or direct visual identity.
- Mobile pages have no horizontal overflow.
- Text remains readable inside buttons, pills, cards, panels, and rows.
- Data freshness, delayed scores, and awaiting-results states remain visible.
- Core sweepstake behavior works without AI.
