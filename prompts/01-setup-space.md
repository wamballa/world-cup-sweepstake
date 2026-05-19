# Prompt 01: Setup Space

Use this prompt to initialize or review the planning workspace.

## Prompt

Review the workspace docs for the World Cup 2026 sweepstake app. Confirm that the folder structure, planning docs, agent role files, and root `AGENTS.md` support a planning-first workflow. Do not create the Next.js app yet.

Check that the following rule is clearly represented everywhere important:

The frontend must never call `football-data.org` directly. All football-data.org calls must be handled centrally by backend polling or sync jobs, then cached in Supabase.

