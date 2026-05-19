# Test Strategy

## Unit Tests

Must cover:

- Fair allocation across participant counts that do and do not divide into 48.
- Team performance scoring.
- Participant totals from allocated teams.
- Badge category calculations.
- Leaderboard ranking and tie handling.
- Match status mapping.
- AI prompt input validation.

## Integration Tests

Must cover:

- Admin creates sweepstake.
- Admin adds participant names and optional emails.
- Admin adds another admin.
- Admin randomly allocates teams.
- Shared link shows allocations, leaderboard, badges, matches, and stats.
- Mocked football-data.org sync updates team scores and badge holders.

## Playwright Journeys

Critical mobile journeys:

- Create sweepstake, add participants, and allocate teams.
- Open shared link and identify allocated team or teams.
- View Participants, Teams, Badges, Matches, and Stats tabs.
- Optional participant email capture.
- See delayed or stale football data messaging.

## Test Data

Seed:

- 48 teams.
- Multiple participant counts: 1, 2, 24, 47, 48, 49, and uneven group sizes.
- Group-stage and knockout fixtures.
- Completed matches with final scores.
- Team stats covering wins, draws, goals, clean sheets, cards, and progression.
- Badge holders for all supported badge categories.
- Sync success and failure responses.

## API Sync Testing

Use fixtures or mocked fetch clients. Tests must never hit the real football-data.org API or require real credentials.
