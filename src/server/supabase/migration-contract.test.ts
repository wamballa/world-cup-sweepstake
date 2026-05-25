import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260519190000_phase_4_persistence.sql",
  ),
  "utf8",
);

describe("Phase 4 Supabase migration contract", () => {
  it("creates the required persistence tables", () => {
    [
      "sweepstakes",
      "sweepstake_admins",
      "participants",
      "participant_emails",
      "badge_categories",
      "teams",
      "team_allocations",
      "allocation_audit_events",
      "matches",
      "team_match_stats",
      "team_scores",
      "participant_scores",
      "badge_holders",
      "football_data_sync_runs",
      "football_data_sync_state",
      "ai_generations",
    ].forEach((table) => {
      expect(migration).toContain(`create table public.${table}`);
    });
  });

  it("enables RLS and keeps participant emails separate", () => {
    expect(migration).toContain(
      "alter table public.participant_emails enable row level security;",
    );
    expect(migration).toContain(
      'create policy "participant emails admin only"',
    );
    const participantsTable = migration.match(
      /create table public\.participants \([\s\S]*?\n\);/,
    )?.[0];

    expect(participantsTable).toBeDefined();
    expect(participantsTable).not.toContain("email text");
  });

  it("adds auth and shared-link helper functions", () => {
    expect(migration).toContain("create trigger on_auth_user_created");
    expect(migration).toContain("create or replace function public.is_sweepstake_admin");
    expect(migration).toContain(
      "create or replace function public.get_sweepstake_by_share_token",
    );
    expect(migration).toContain("and s.status = 'shared'");
    expect(migration).toContain(
      "share_token text not null unique default encode(gen_random_bytes(24), 'base64url')",
    );
  });

  it("keeps privileged and private data behind RLS policies", () => {
    [
      "football_data_sync_runs",
      "football_data_sync_state",
      "ai_generations",
      "email_update_logs",
    ].forEach((table) => {
      expect(migration).toContain(
        `alter table public.${table} enable row level security;`,
      );
    });

    const syncPolicies = migration.match(
      /create policy "[^"]+" on public\.football_data_sync_/g,
    );

    expect(syncPolicies).toBeNull();
    expect(migration).toContain('create policy "email logs admin read"');
    expect(migration).toContain('create policy "ai generations admin read"');
  });
});

const aiCacheMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260522140000_ai_generation_cache_key.sql",
  ),
  "utf8",
);

const historicalTournamentMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260523120000_historical_world_cup_tournaments.sql",
  ),
  "utf8",
);

describe("AI generation cache migration contract", () => {
  it("deduplicates AI generations by sweepstake, feature, and input hash", () => {
    expect(aiCacheMigration).toContain(
      "ai_generations_sweepstake_feature_hash_idx",
    );
    expect(aiCacheMigration).toContain(
      "on public.ai_generations(sweepstake_id, feature_key, input_hash)",
    );
  });
});

describe("Historical World Cup tournament migration contract", () => {
  it("scopes football-data external IDs by tournament season and records reset audits", () => {
    expect(historicalTournamentMigration).toContain(
      "drop constraint if exists teams_external_id_key",
    );
    expect(historicalTournamentMigration).toContain(
      "on public.teams(tournament_code, external_id)",
    );
    expect(historicalTournamentMigration).toContain(
      "on public.matches(tournament_code, external_id)",
    );
    expect(historicalTournamentMigration).not.toContain(
      "add value if not exists 'tournament_reset'",
    );
  });
});
