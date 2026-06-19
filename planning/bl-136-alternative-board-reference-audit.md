# BL-136 Alternative Board Reference Audit

Date: 2026-06-19

## Summary

This audit scanned user-facing copy, routes, tests, feature flags, helper names, and snapshot fields that still refer to the hidden `Alternative Board` experience before it is promoted to become the main board.

No scoring, schema, snapshot behavior, movement logic, allocation logic, or official board behavior was changed as part of this audit.

Search patterns used:

- `alternative board`, `Alternative Board`, `hidden board`, `hidden Alternative`
- `alternative-board`, `AlternativeBoard`, `alternativeBoard`, `ALTERNATIVE_BOARD`
- `alternative_*`, `alternativeRank`, `alternativeScore`, `alternativeTeam`
- `Luck of the Draw`, `official board`

## Rename When Promoting To Main Board

These references are safe candidates for a later rename story because they describe the board as hidden or alternative rather than main.

- User-facing copy:
  - `src/features/sweepstake-demo/alternative-board.tsx`
    - `Badges on this Alternative Board are awarded by team performance...`
    - `The Participants tab shows the original Luck of the Draw participant view.`
- Component and route names:
  - `src/features/sweepstake-demo/alternative-board.tsx`
    - `AlternativeBoard`
  - `src/app/s/[shareToken]/alternative-board/page.tsx`
    - `AlternativeBoardPage`
    - `/alternative-board` route segment
- Data helper names:
  - `src/features/shared-board/alternative-board-data.ts`
    - `AlternativeBoardRow`
    - `alternativeBoardScoringRules`
    - `buildAlternativeBoardRows`
    - `calculateAlternativeBoardTeamPoints`
    - `calculateAlternativeBoardSnapshotTeamPoints`
    - `calculateAlternativeBoardPoints`
    - file name `alternative-board-data.ts`
- Tests and test descriptions:
  - `src/features/sweepstake-demo/alternative-board.test.tsx`
  - `src/features/shared-board/alternative-board-data.test.ts`
  - `tests/e2e/design-foundations.spec.ts`
    - test suite names such as `Alternative board overflow`
    - URLs that load `/alternative-board`

## Preserve Temporarily For Compatibility

These references should not be renamed casually because they affect routing, feature gating, snapshots, or persisted data contracts.

- Route compatibility:
  - `/s/[shareToken]/alternative-board` should either remain as a redirect/alias or be removed only after a planned rollout.
- Feature flag:
  - `ALTERNATIVE_BOARD_ENABLED` in `src/app/s/[shareToken]/alternative-board/page.tsx` should remain until the new main-board route is live and the old hidden route is retired.
- Snapshot schema and movement fields:
  - `supabase/migrations/20260617150000_leaderboard_snapshots.sql`
    - `alternative_rank`
    - `alternative_score`
    - `alternative_total_points`
    - `alternative_team_count`
    - `alternative_team_ids`
  - `src/server/supabase/database.types.ts`
  - `src/server/persistence/leaderboard-snapshots.ts`
  - `src/server/shared-board/leaderboard-snapshot-movement.ts`
  - Related tests under `src/server/persistence` and `src/server/shared-board`

These can keep their existing names internally while the board is promoted, unless a later migration explicitly renames persisted columns and updates database types.

## Migration Plan Needed

A later implementation story should decide the promotion path before any rename:

- Whether `/s/[shareToken]` should render the current Alternative Board directly.
- Whether `/s/[shareToken]/alternative-board` becomes a redirect, alias, or removed route.
- Whether the old official Luck of the Draw view is retained anywhere, and if so under what route/name.
- Whether `ALTERNATIVE_BOARD_ENABLED` is removed, inverted, or kept as a rollout safeguard.
- Whether `AlternativeBoard` and `alternative-board-data` are renamed immediately or left as internal names for one release to reduce risk.
- Whether persisted `alternative_*` snapshot columns are kept as compatibility names or renamed through a dedicated migration.

## Recommended Follow-Up Story

Create a separate promotion story that changes the route/rendering behavior and user-facing terminology in one controlled pass, with tests proving:

- The shared link opens the promoted main board.
- The old `/alternative-board` URL still behaves intentionally.
- Existing Change column movement still reads snapshot data correctly.
- The old official Luck of the Draw scoring remains unchanged if that board is retained.
