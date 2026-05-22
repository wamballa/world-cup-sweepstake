# Codex Operating Instructions

This is the root operating instruction file for the World Cup 2026 sweepstake app. Follow it before any build, architecture, product, or implementation work.

Do not build the application, scaffold Next.js, install dependencies, create product source code, or create final UI wireframes until explicitly requested.

## Project Summary

Build a premium, polished, slick, mobile-first World Cup 2026 sweepstake app for offices, friends, families, and groups.

Admins create a friendly office sweepstake, add participants, then randomly allocate the 48 World Cup teams as fairly as possible. Participants open a shared scoreboard link to see their allocated team or teams, follow team performance, view badges, track the leaderboard, and optionally receive email updates.

The product may take broad inspiration from Playdrawr-style sweepstake setup simplicity, but must use original branding, original UI, original copy, and original product design.

## Preferred Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion or Framer Motion
- Supabase Postgres
- Supabase Auth
- Supabase Realtime
- football-data.org API
- OpenAI API
- Vitest
- Playwright

## Working Principles

- Plan before building.
- Keep changes small and reviewable.
- Do not invent requirements.
- Prefer simple, production-ready architecture.
- Avoid unnecessary complexity.
- Keep the experience low friction for admins and participants.
- Record important decisions in `/planning/decision-log.md`.
- Track unresolved questions in `/planning/open-questions.md`.
- Track work items and phase sequencing only in `/backlog.md`.
- Read relevant files in `/docs`, `/planning`, and `/agents` before making decisions.

## Product Rules

- The app must feel premium, polished, slick, and mobile-first.
- Playdrawr may be used only as broad category inspiration.
- Do not copy Playdrawr branding, layout, text, proprietary mechanics, or visual identity.
- Participants do not submit match-score guesses.
- There are no match-score entry flows, entry cutoffs, or entry lock rules.
- The app is based on admin-controlled random team allocation and automatic team performance scoring.
- Team allocation must distribute 48 teams as fairly as possible across participants.
- Team and participant scoring must be deterministic, testable, and recalculable from cached football data.
- Leaderboards must be recalculable from stored allocations and team performance data.
- Core sweepstake, allocation, scoring, badge, and leaderboard features must work without AI.

## Football Data Rules

- The frontend must never call `football-data.org` directly.
- All `football-data.org` calls must happen server-side.
- Use a central polling and sync model.
- Cache football fixtures, status, scores, tables, team stats, and results in Supabase.
- Respect football-data.org rate limits.
- Store sync logs and last successful sync time.
- Design for delayed scores on the free tier and live scores if upgraded later.

## AI Rules

- AI must not invent football facts, scores, lineups, injuries, form, statistics, or badge outcomes.
- AI output must be grounded only in cached app data unless a future approved data source is added.
- AI should enhance the user experience through match summaries, leaderboard banter, and sweepstake updates.
- AI must not make gambling-style advice or claim certainty.
- AI must never alter official scores, team points, allocations, badges, or standings.

## Security Rules

- API keys must never be exposed to the browser.
- The Supabase service role key must only be used server-side.
- Shared sweepstake links must reveal only the intended sweepstake view.
- Admin-only actions must require admin authorization.
- Use Supabase Row Level Security where appropriate.
- Server-side authorization is required for sensitive mutations.

## Testing Rules

- Fair allocation logic must have unit tests.
- Team performance scoring must have unit tests.
- Prize category calculations must have unit tests.
- Leaderboard calculation must have unit tests.
- Critical admin and participant journeys must have Playwright tests.
- API sync logic must be testable without hitting the real football-data.org API.

## Agent Operating Model

Consult the project agents when their area is involved:

- Product Owner: MVP scope, admin and participant journeys, sweepstake rules, badge rules, open questions.
- Solution Architect: system design, data flow, technical sequencing, architecture decisions.
- Football Data Engineer: football-data.org sync, caching, rate limits, sync logs, score freshness.
- UX/UI Designer: mobile-first flows, premium interface, interaction polish, original visual direction.
- AI Experience Designer: grounded AI summaries, sweepstake updates, banter, tone, and safety.
- Test Engineer: unit, integration, Playwright, fixtures, edge cases, and quality gates.
- Security Engineer: secrets, RLS, admin access, shared links, server-only operations, abuse prevention.

Role-specific guidance lives in `/agents`.

## Backlog Authority

`/backlog.md` is the single source of truth for phase sequencing, work item IDs, and implementation status. Do not maintain a second phase list in this file.

Do not skip backlog phases or move work between phases without recording the reason in `/planning/decision-log.md`.
