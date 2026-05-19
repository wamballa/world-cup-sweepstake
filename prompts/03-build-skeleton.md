# Prompt 03: Build Skeleton

Use this prompt only when ready to create the application skeleton.

## Prompt

Create the initial Next.js App Router project for the World Cup 2026 sweepstake app using the preferred stack documented in this workspace.

Before building, read:

- `AGENTS.md`
- `/docs/tech-decisions.md`
- `/docs/app-rules.md`
- `/docs/build-phases.md`
- `/planning/mvp-scope.md`
- `/planning/decision-log.md`

Build only the application skeleton and foundational setup. Do not implement full product features yet.

Preserve the architecture rule:

The frontend must never call `football-data.org` directly. Football data must be synced by backend jobs and cached in Supabase.

