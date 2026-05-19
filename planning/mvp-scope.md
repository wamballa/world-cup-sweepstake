# MVP Scope

## In MVP

- Admin creates a sweepstake.
- Admin enters sweepstake name and selects FIFA World Cup 2026.
- Admin adds participant names.
- Admin can add optional participant emails.
- Admin can add other admins.
- Admin presses `Randomly Allocate Teams`.
- App fairly allocates 48 World Cup teams across participants.
- Admin can rerun random allocation or manually move teams between participants.
- Unguessable shared scoreboard link shows the sweepstake read-only participant view.
- Leaderboard ranks participants by allocated team performance points.
- Tabs show Participants, Teams, Badges, Matches, and Stats.
- football-data.org data is centrally polled and cached.
- App updates team scores, tables, badge holders, and participant leaderboard from cached data.
- AI creates match summaries, leaderboard banter, and sweepstake updates from cached app data.
- Email updates notify participants who have provided email addresses.

## Out of MVP

- User-submitted match-score guesses.
- Match-score entry forms.
- Match-score entry cutoffs or lock rules.
- Entry fees.
- Prize pots, payments, or physical prize management.
- Betting, gambling, or prize payment handling.
- Native mobile apps.
- Public sweepstake discovery.
- User-to-user chat.
- Full admin CMS.
- Admin scoring customization.
- Guaranteed live scores on the football-data.org free tier.
- Manual editing of official football results.
- Passcode-protected sweepstake links.

## Key User Journeys

- Admin creates a sweepstake, adds participants, and allocates teams.
- Admin adds another admin to help manage the sweepstake.
- Admin can adjust allocations by rerunning the random draw or moving teams between participants.
- Participant opens a shared scoreboard link and sees their allocated team or teams.
- Participant optionally adds an email address for updates.
- Participant checks leaderboard, team progress, badge status, matches, and stats.
- Participant receives email updates for points changes, match results, and badge changes if they have provided an email address.

## Fair Allocation Rule

All 48 teams must be assigned. If participant count divides evenly into 48, each participant gets the same number of teams. If not, distribute teams as evenly as possible:

- Shuffle teams using a server-side random allocation process.
- Shuffle participants before assignment.
- Assign `floor(48 / participant_count)` teams to every participant.
- Distribute the remaining teams one by one to randomly ordered participants.
- Difference between the largest and smallest allocation must never exceed one team.
- Store allocation seed or audit metadata so allocation can be reviewed.

## Allocation Management

- Admins can rerun random team allocation.
- Admins can manually move teams between participants after allocation.
- Manual team moves are admin-only and should be logged with who made the change and when.
- Reruns should replace the previous allocation set and store fresh allocation audit metadata.
- All 48 teams must remain assigned after any rerun or manual move.
- The app should warn admins when changing allocations after the scoreboard link has been shared.

## Default Scoring

The MVP uses one fixed default scoring model. Admin scoring customization is out of scope.

- Group stage win: 3 points.
- Group stage draw: 1 point.
- Reach Round of 16: 5 points.
- Reach Quarter-final: 8 points.
- Reach Semi-final: 12 points.
- Runner-up: 15 points.
- Win the World Cup: 25 points.

Participant score is the sum of all allocated team scores.

## Badge Categories

- 1st Place: participant with the highest total.
- 2nd Place: participant with the second-highest total.
- 3rd Place: participant with the third-highest total.
- 4th Place: participant with the fourth-highest total.
- Wooden Spoon: participant with the lowest total points.
- First Knocked Out: participant allocated the first team eliminated from the tournament.
- Most Goals Conceded: participant allocated the team with highest goals conceded.
- Fewest Goals Scored: participant allocated the team with lowest goals scored.
- Most Cards: manual/future badge unless reliable bookings data is available.
- Golden Boot Team: manual/future badge unless reliable award or scorer data is available.
- Golden Glove Team: manual/future badge unless reliable award data is available.

Badge categories are bragging-rights indicators, not monetary or physical prizes. They can appear as icons and/or short text next to participant names as the competition progresses.

## Tie Handling

- Leaderboard participants with the same points share the same rank.
- Badge categories can have shared holders when the underlying World Cup data produces a tie.
- The app should not invent artificial team-level tie-breakers for MVP.
- No in-app prize splitting or payout handling is required.
