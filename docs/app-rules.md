# App Rules

## Sweepstake Rules

- Admins create sweepstakes for FIFA World Cup 2026.
- Admins add participant names and optional participant emails.
- Admins may add other admins.
- Admins do not configure entry fees or prizes in MVP.
- Badge categories are used for friendly bragging rights.
- Participants do not submit match-score guesses.
- The sweepstake is based on random team allocation and automatic scoring.

## Allocation Rules

- All 48 World Cup teams must be allocated.
- Allocation is triggered by an admin action.
- Teams must be distributed as fairly as possible across participants.
- If participant count divides evenly into 48, every participant gets the same number of teams.
- If not, the difference between the most and fewest teams allocated must not exceed one.
- Allocation should be stored and auditable.

## Scoring Rules

- Team and participant scoring must be deterministic, testable, and recalculable.
- Admins can use default scoring.
- Participant score is the sum of all allocated team scores.
- Scores come from cached football data, never direct frontend API calls.

## Data Rules

- The frontend must never call `football-data.org`.
- Match fixtures, statuses, scores, stats, and results must be synced to Supabase.
- Scores shown in the UI should identify whether they are delayed, stale, live, or final.

## AI Rules

- AI must never change official scores, points, allocations, badges, or standings.
- AI text should be clearly secondary to factual app data.
- AI banter should stay friendly, non-abusive, and suitable for offices and groups.
