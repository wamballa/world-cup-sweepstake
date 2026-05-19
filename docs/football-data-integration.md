# Football Data Integration

## Core Rule

The frontend must never call `football-data.org`. All calls happen server-side through central polling and sync jobs, then cached in Supabase.

## Safe Usage Model

- One central sync flow fetches fixtures, match status, scores, tables, team stats, and available disciplinary data.
- User page views read Supabase cache only.
- Sync jobs respect plan limits and avoid per-user API calls.
- Every sync writes a run log and updates last successful sync time.
- Scheduled sync runs through Vercel Cron against server-side Next.js route handlers or server jobs.

## MVP Plan

- Use football-data.org API v4.
- Use the free tier.
- Free tier gives delayed scores, delayed fixtures/schedules, league tables where supported, and 10 authenticated calls per minute.
- FIFA World Cup is available on the free tier.
- FIFA World Cup competition id/code: `2000` / `WC`.
- Use `season=2026` for World Cup 2026 calls when supported by the endpoint.
- Do not rely on live scores for MVP.
- Do not rely on deep data such as line-ups, substitutions, goal scorers, bookings/cards, or squads on the free tier.
- If standings are unavailable for the World Cup because it is a cup competition, derive app scoring and badge state from cached matches instead.

## Cached Data

Cache:

- Competition and season identifiers.
- Teams and team metadata.
- Fixtures and kickoff times.
- Match status.
- Home and away scores.
- Goals scored and conceded by team.
- Clean sheets.
- Group progress and knockout progress.
- Cards if available from the chosen plan and endpoints.
- Last synced timestamp.
- Source payload checksum or version where useful.

## MVP Endpoints

- `GET /v4/competitions/WC`
- `GET /v4/competitions/WC/teams?season=2026`
- `GET /v4/competitions/WC/matches?season=2026`
- `GET /v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE`
- `GET /v4/competitions/WC/matches?season=2026&status=FINISHED`
- `GET /v4/matches/{id}` for targeted match refreshes when needed.
- `GET /v4/competitions/WC/standings?season=2026` only if it is available for the World Cup response; do not make the app depend on it.

## Polling Cadence

Initial cadence:

- Fixtures and schedule: daily.
- Matches within 48 hours: every 2 to 4 hours.
- Matchday active window: every 15 to 30 minutes if plan allows.
- Completed matches: re-check after final, then once the next day for corrections.
- Tables and team stats: after completed-match syncs.

Keep the cadence within the free-tier 10 calls/minute limit and tune it during implementation.

## Delayed Scores

Design first for delayed scores on the free tier. Show freshness labels such as delayed, last updated, final, or update pending. Do not imply live data unless the data source supports it.

## Live Upgrade Path

If upgraded later, increase polling for in-progress matches or use available live endpoints. The frontend should not change its source; it should continue reading cached Supabase match status, scores, standings, and team stats.

## Prize Data Limits

Golden Boot Team, Golden Glove Team, and Most Cards depend on endpoint availability. On the free tier, line-ups, goal scorers, bookings/cards, and squads are not available as dependable MVP data, so these badges should be marked manual, unavailable, or future integrations unless a later approved data source or paid tier is added.

## Failure Handling

- Store sync status, timestamps, duration, endpoint, records changed, and error messages.
- Keep the previous known good cache if a sync fails.
- Surface stale data in admin or operational views.
- Tests must mock API responses and never require real credentials.
