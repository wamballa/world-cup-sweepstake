# World Cup 2026 Sweepstake

A planning workspace for a premium, mobile-first World Cup 2026 sweepstake app for offices, friends, families, and groups.

Admins create a friendly office sweepstake, add participants, and randomly allocate World Cup teams. Participants use a shared scoreboard link to follow their teams, leaderboard position, badge status, matches, and tournament progress.

## Current Status

Backlog Phase 1, scaffold and design foundation, is complete. The workspace contains a Next.js App Router application with TypeScript, Tailwind CSS v4, shadcn/ui primitives, Motion, Vitest, and Playwright.

## Key Rule

The frontend must never call `football-data.org` directly. Football data will be synced centrally by backend jobs and cached in Supabase for the app to read.

## Workspace Structure

- `/docs` - product vision, app rules, technical decisions, and build phases.
- `/agents` - role-specific guidance for planning and implementation agents.
- `/planning` - open questions, MVP scope, and decision log.
- `/prompts` - reusable prompts for staged project work.
- `/backlog.md` - single source of truth for phases, work item IDs, and implementation status.
- `/src/app` - Next.js App Router routes, layout, and global styles.
- `/src/components` - app shell and reusable UI components.
- `/src/features` - feature modules with deterministic domain logic.
- `/src/test` - Vitest setup.
- `/tests` - Playwright end-to-end tests.

## Local Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Deployment

The app is configured for Vercel hosting. The production deployment uses Vercel Cron to call `/api/cron/football-data-sync` once daily at 06:00 UTC, declared in `/vercel.json`.

Required Vercel environment variables for the deployed app and football-data sync:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FOOTBALL_DATA_API_TOKEN`
- `FOOTBALL_DATA_SYNC_SECRET`
- `CRON_SECRET`

Future AI and email work will also require:

- `OPENAI_API_KEY`
- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_FROM`

The cron route accepts `GET` or `POST` and requires `Authorization: Bearer $CRON_SECRET`. For local/manual checks, it falls back to `FOOTBALL_DATA_SYNC_SECRET` when `CRON_SECRET` is not configured.

## Preferred Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Motion, Supabase, football-data.org, OpenAI API, Vitest, and Playwright.
