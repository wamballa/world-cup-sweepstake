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

const aiLifecycleMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260614110000_ai_generation_lifecycle.sql",
  ),
  "utf8",
);

const aiCacheRepairMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260614143000_repair_ai_generation_cache_constraint.sql",
  ),
  "utf8",
);

const leaderboardSnapshotsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260617150000_leaderboard_snapshots.sql",
  ),
  "utf8",
);

const boardVariantMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260619100000_board_variant.sql",
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

  it("serializes generation and records admin rewrites", () => {
    expect(aiLifecycleMigration).toContain(
      "create or replace function public.claim_ai_generation",
    );
    expect(aiLifecycleMigration).toContain("generation_status");
    expect(aiLifecycleMigration).toContain("generation_reason");
    expect(aiLifecycleMigration).toContain("rewritten_by");
    expect(aiLifecycleMigration).toContain("lease_expires_at");
    expect(aiLifecycleMigration).toContain(
      "'generating', 'ready', 'invalid'",
    );
    expect(aiLifecycleMigration).toContain("grant execute");
    expect(aiLifecycleMigration).toContain("to service_role");
  });

  it("repairs the production cache-key constraint used by generation claims", () => {
    expect(aiCacheRepairMigration).toContain(
      "create unique index ai_generations_claim_unique_idx",
    );
    expect(aiCacheRepairMigration).toContain(
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

describe("Leaderboard snapshot migration contract", () => {
  it("adds append-only leaderboard snapshot tables", () => {
    expect(leaderboardSnapshotsMigration).toContain(
      "create type public.leaderboard_snapshot_trigger",
    );
    expect(leaderboardSnapshotsMigration).toContain(
      "create table public.leaderboard_snapshots",
    );
    expect(leaderboardSnapshotsMigration).toContain(
      "create table public.leaderboard_snapshot_rows",
    );
    expect(leaderboardSnapshotsMigration).toContain(
      "unique (sweepstake_id, snapshot_key)",
    );
    expect(leaderboardSnapshotsMigration).toContain(
      "leaderboard_snapshots_initial_baseline_unique_idx",
    );
  });

  it("keeps snapshot data behind admin-only RLS reads", () => {
    expect(leaderboardSnapshotsMigration).toContain(
      "alter table public.leaderboard_snapshots enable row level security;",
    );
    expect(leaderboardSnapshotsMigration).toContain(
      "alter table public.leaderboard_snapshot_rows enable row level security;",
    );
    expect(leaderboardSnapshotsMigration).toContain(
      'create policy "leaderboard snapshots admin read"',
    );
    expect(leaderboardSnapshotsMigration).toContain(
      'create policy "leaderboard snapshot rows admin read"',
    );
    expect(leaderboardSnapshotsMigration).not.toContain("for insert");
    expect(leaderboardSnapshotsMigration).not.toContain("to anon");
  });
});

describe("Board variant migration contract", () => {
  it("adds a sweepstake-level board variant without changing snapshots", () => {
    expect(boardVariantMigration).toContain("create type public.board_variant");
    expect(boardVariantMigration).toContain("'official', 'alternative'");
    expect(boardVariantMigration).toContain(
      "add column if not exists board_variant public.board_variant not null default 'official'",
    );
    expect(boardVariantMigration).toContain(
      "create or replace function public.get_sweepstake_by_share_token",
    );
    expect(boardVariantMigration).toContain(
      "board_variant public.board_variant",
    );
    expect(boardVariantMigration).not.toContain("leaderboard_snapshot_rows");
  });
});
