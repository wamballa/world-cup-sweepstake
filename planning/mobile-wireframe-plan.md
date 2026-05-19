# Mobile-First Wireframe Plan

This is a low-fidelity product and layout plan before UI build. It defines screens, hierarchy, flows, and states only. It is not a final visual design or scaffold.

## Principles

- Mobile-first: every core action must work comfortably on a phone.
- Actual app first: no marketing landing page is required for MVP.
- Shallow navigation: admin setup uses clear steps; participant view uses tabs.
- Scoreboard clarity: participants should see teams, rank, points, badges, and latest update within seconds.
- Friendly office tone: no betting, fees, prize pot, or gambling language.
- Data honesty: delayed/stale/final states must be visible where scores or standings appear.

## Information Architecture

Admin surface:

- Create sweepstake.
- Add participants.
- Add optional emails.
- Add admins.
- Allocate teams.
- Review allocation.
- Share scoreboard link.
- Manage allocation after sharing.

Participant surface:

- Shared scoreboard home.
- Participants tab.
- Teams tab.
- Badges tab.
- Matches tab.
- Stats tab.
- Optional email capture.
- AI update surface.

## Admin Flow

### Screen A1: Create Sweepstake

Purpose: start a friendly office World Cup sweepstake quickly.

Mobile hierarchy:

- Header: product/app name and short sweepstake label.
- Primary field: sweepstake name.
- Tournament field: FIFA World Cup 2026, preselected and locked/read-only for MVP.
- Primary action: create sweepstake / continue.

States:

- Empty name.
- Name validation error.
- Loading create state.

Notes:

- No entry fee, currency, prize type, or passcode fields.

### Screen A2: Participant Entry

Purpose: add colleagues quickly.

Mobile hierarchy:

- Header with sweepstake name.
- Multiline participant entry area for paste/type names.
- Parsed participant preview list.
- Inline add row button.
- Optional email affordance per participant, secondary to name entry.
- Count summary: participants added and estimated teams per participant.
- Primary action: continue.

States:

- Empty participants.
- Duplicate names warning.
- Invalid email warning.
- Uneven allocation preview.

Interaction notes:

- Paste-friendly entry is preferred over one tiny field at a time.
- Email capture must not slow down adding names.

### Screen A3: Add Admins

Purpose: invite or add other admins without blocking setup.

Mobile hierarchy:

- Optional admin email entry.
- Existing admins list.
- Skip/continue action.

States:

- No extra admins.
- Invalid admin email.
- Invite pending.

### Screen A4: Allocate Teams

Purpose: make the draw feel important and understandable.

Mobile hierarchy:

- Summary: number of participants, 48 teams, allocation fairness statement.
- Estimated distribution: e.g. each person gets N or N/N+1 teams.
- Primary action: Randomly Allocate Teams.
- Secondary note: can rerun or manually adjust later.

States:

- Not enough participants.
- Allocation running.
- Allocation failed.

Motion guidance:

- Use a short tactile reveal. Do not make users wait through long animation.

### Screen A5: Allocation Review

Purpose: check and adjust before sharing.

Mobile hierarchy:

- Fairness summary.
- Participant list with allocated team chips.
- Controls:
  - Rerun random allocation.
  - Move team.
  - Confirm/share.
- Audit note: allocation created at time/date.

States:

- Initial allocation.
- Rerun confirmation.
- Manual move mode.
- Validation error if any team would become unassigned.

Manual move interaction:

- Tap a team chip.
- Choose destination participant from a searchable list.
- Confirm move.

### Screen A6: Share Scoreboard

Purpose: hand over the read-only participant link.

Mobile hierarchy:

- Success state.
- Read-only scoreboard link.
- Copy/share controls.
- Link access note: anyone with link can view scoreboard; only admins can edit.
- Open scoreboard preview.

States:

- Copy success.
- Share unavailable.

### Screen A7: Admin Manage Sweepstake

Purpose: ongoing admin control after sharing.

Mobile hierarchy:

- Sweepstake status and last football-data sync.
- Quick actions:
  - View scoreboard.
  - Copy link.
  - Manage participants.
  - Manage allocation.
  - Send/update emails when available.
- Recent audit activity.

States:

- Shared.
- Football data stale.
- Allocation changed after sharing warning.

## Participant Flow

### Screen P1: Shared Scoreboard Home

Purpose: show the participant what matters immediately.

Mobile hierarchy:

- Sweepstake name.
- Data freshness label.
- AI update card, if available and grounded in cached data.
- Leaderboard preview: top few participants.
- "Find me" or participant search.
- Tab bar: Participants, Teams, Badges, Matches, Stats.

States:

- Loading scoreboard.
- Invalid/expired link.
- No allocations yet.
- Stale or delayed football data.

### Screen P2: Participant Identity / Email Capture

Purpose: optional updates without requiring account creation.

Mobile hierarchy:

- Participant selector/search.
- Selected participant summary: teams, rank, points, badges.
- Optional email field.
- Consent text for update emails.
- Save email action.

States:

- No email.
- Email saved.
- Email invalid.
- Verification pending if email verification is later required.

Notes:

- Email capture must never expose other participants' emails.

## Scoreboard Tabs

### Participants Tab

Purpose: main leaderboard.

Mobile hierarchy:

- Rank, participant name, points.
- Allocated team chips.
- Badge icons/text next to participant names.
- Rank movement or latest change, where available.
- Shared-rank display for ties.

States:

- No scores yet.
- Tied ranks.
- Data stale.

### Teams Tab

Purpose: follow allocated teams.

Mobile hierarchy:

- Team list grouped by participant or searchable by team.
- Team status: group, stage, eliminated, qualified, runner-up, winner.
- Team score and upcoming/last match.
- Assigned participant.

States:

- Fixtures not synced yet.
- Team eliminated.
- Team qualified to next stage.

### Badges Tab

Purpose: show friendly bragging-rights categories.

Mobile hierarchy:

- Badge category list.
- Current holder(s).
- Supporting data line.
- Manual/future badges marked clearly.

Automated badge categories:

- 1st Place.
- 2nd Place.
- 3rd Place.
- 4th Place.
- Wooden Spoon.
- First Knocked Out.
- Most Goals Conceded.
- Fewest Goals Scored.

Manual/future badge categories:

- Most Cards.
- Golden Boot Team.
- Golden Glove Team.

States:

- Badge not decided yet.
- Shared holders.
- Manual/future disabled or pending display.

### Matches Tab

Purpose: show fixtures and results with honest freshness.

Mobile hierarchy:

- Date grouping.
- Match row: teams, kickoff/status, score.
- Data freshness marker.
- Filter chips: upcoming, live/delayed, finished, my teams.

States:

- Fixtures delayed.
- Finished match awaiting confirmation.
- Postponed/cancelled.

### Stats Tab

Purpose: compact tournament stats for interest and badge support.

Mobile hierarchy:

- Scoring breakdown.
- Team progress counts.
- Goals for/against where available.
- Clean data limitation note where needed.

States:

- Stats unavailable on free tier.
- Stats delayed/stale.

## AI Surface

Placement:

- Small update block on scoreboard home.
- Optional expanded detail from Matches, Badges, or Participants.

Rules:

- Always based on cached data.
- Show data freshness context nearby.
- Do not imply live data.
- Do not predict outcomes with certainty.
- Keep banter office-safe.

States:

- AI summary unavailable.
- AI summary stale because source data changed.
- AI generation failed.

## Email Surface

Placement:

- Optional capture in participant identity flow.
- Admin email status in admin manage view.

Rules:

- Email is for updates only.
- Display names and emails are separate.
- Do not show participant emails on public scoreboard.

States:

- No email.
- Email saved.
- Verification pending if required later.
- Email send failed.

## System States

Loading:

- Use skeleton lists for leaderboard, teams, badges, and matches.

Empty:

- No participants.
- No allocation yet.
- No football data synced yet.

Error:

- Invalid shared link.
- Sync unavailable.
- Allocation failed.
- Email save failed.

Freshness:

- Delayed.
- Last updated.
- Final.
- Update pending.
- Stale.

## Mobile Navigation

Admin:

- Step-based setup with one primary action per screen.
- Keep secondary actions visible but subdued.
- After sharing, use a compact action list.

Participant:

- Sticky bottom or top tab navigation for Participants, Teams, Badges, Matches, Stats.
- Scoreboard home should expose the most important summary before tab exploration.

## Desktop Adaptation

Desktop should reuse the same information hierarchy:

- Admin setup can use two-column layouts for form and preview.
- Scoreboard can show leaderboard and selected tab content side by side.
- Do not add unrelated dashboard complexity for desktop.

## Wireframe Acceptance Checklist

- Admin can create a sweepstake without seeing fee/prize/passcode fields.
- Admin can add many participant names quickly.
- Admin can allocate, rerun, manually move teams, and share the scoreboard link.
- Participant can immediately see teams, rank, points, badges, and update freshness.
- Tabs cover Participants, Teams, Badges, Matches, and Stats.
- AI and email appear as enhancements, not authoritative scoring.
- Stale/delayed data is visible.
- Manual/future badges are not presented as automatically available.
