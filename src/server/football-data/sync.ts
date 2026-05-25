import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/server/supabase/database.types";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";
import { getFootballDataTournamentByCode } from "@/features/tournaments/world-cup";

import { cacheFootballData } from "./cache";
import { createFootballDataClient, type FootballDataClient } from "./client";
import { cacheTeamFlagAssets, type TeamFlagAssetResult } from "./flag-assets";
import { normalizeFootballDataPayload } from "./normalize";
import { recalculateAllSweepstakeScores } from "./recalculate";
import { footballDataConfig } from "./types";
import {
  createSyncRun,
  finishSyncRun,
  updateSyncState,
} from "./cache";

export type FootballDataSyncResult = {
  runId: string;
  status: "succeeded" | "failed" | "skipped";
  teamCount: number;
  matchCount: number;
  statCount: number;
  recordsChanged: number;
  recalculatedSweepstakes: number;
  flagAssetResult?: TeamFlagAssetResult;
  errorMessage?: string;
};

const minimumSyncIntervalMs = 60_000;

export async function runFootballDataSync(options?: {
  supabase?: SupabaseClient;
  client?: FootballDataClient;
  now?: () => Date;
  tournamentCode?: string;
}): Promise<FootballDataSyncResult> {
  const supabase = options?.supabase ?? getSupabaseServiceRoleClient();
  const now = options?.now ?? (() => new Date());
  const tournament = getFootballDataTournamentByCode(
    options?.tournamentCode ?? footballDataConfig.tournamentCode,
  );
  const latestRun = await loadLatestSyncRun(supabase);

  if (
    latestRun &&
    shouldSkipFootballDataSync(latestRun.started_at, now(), minimumSyncIntervalMs)
  ) {
    return {
      runId: latestRun.id,
      status: "skipped",
      teamCount: 0,
      matchCount: 0,
      statCount: 0,
      recordsChanged: 0,
      recalculatedSweepstakes: 0,
      errorMessage:
        "Skipped football-data.org sync because the last sync started less than one minute ago.",
    };
  }

  const client =
    options?.client ??
    createFootballDataClient({
      tournamentCode: tournament.code,
    });
  const metadata = {
    source: "football-data.org",
    competitionCode: tournament.competitionCode,
    season: tournament.season,
    tournamentCode: tournament.code,
    tournamentLabel: tournament.label,
    cadence: "central-polling",
    freeTierFreshness: "delayed-scores-supported",
    minimumSyncIntervalSeconds: minimumSyncIntervalMs / 1000,
  } satisfies Json;
  const runId = await createSyncRun(supabase, metadata);

  try {
    const [teams, matches] = await Promise.all([
      client.getTeams(),
      client.getMatches(),
    ]);
    const normalized = normalizeFootballDataPayload(
      { teams, matches },
      tournament.code,
    );
    const cacheResult = await cacheFootballData(supabase, {
      teams: normalized.teamRows,
      matches: normalized.matchRows,
      teamStats: normalized.teamStats,
    }, {
      tournamentCode: tournament.code,
    });
    const flagAssetResult = await tryCacheTeamFlagAssets(supabase, tournament.code);
    const sourceUpdatedAt = now().toISOString();
    const recalculatedSweepstakes = await recalculateAllSweepstakeScores(
      supabase,
      sourceUpdatedAt,
      tournament.code,
    );
    const recordsChanged =
      normalized.recordsChanged + recalculatedSweepstakes;
    const successMetadata = {
      ...metadata,
      cacheResult,
      flagAssetResult,
      recalculatedSweepstakes,
      lastSuccessfulSyncAt: sourceUpdatedAt,
    } satisfies Json;

    await finishSyncRun(supabase, {
      runId,
      status: "succeeded",
      recordsChanged,
      metadata: successMetadata,
    });
    await updateSyncState(supabase, {
      tournamentCode: tournament.code,
      runId,
      lastSuccessfulSyncAt: sourceUpdatedAt,
      metadata: successMetadata,
    });

    return {
      runId,
      status: "succeeded",
      teamCount: cacheResult.teamCount,
      matchCount: cacheResult.matchCount,
      statCount: cacheResult.statCount,
      recordsChanged,
      recalculatedSweepstakes,
      flagAssetResult,
    };
  } catch (error) {
    const errorMessage = getCaughtErrorMessage(error);

    await finishSyncRun(supabase, {
      runId,
      status: "failed",
      recordsChanged: 0,
      errorMessage,
      metadata,
    });

    return {
      runId,
      status: "failed",
      teamCount: 0,
      matchCount: 0,
      statCount: 0,
      recordsChanged: 0,
      recalculatedSweepstakes: 0,
      errorMessage,
    };
  }
}

async function tryCacheTeamFlagAssets(
  supabase: SupabaseClient,
  tournamentCode: string,
) {
  try {
    return await cacheTeamFlagAssets(supabase, {
      tournamentCode,
      batchSize: getFlagAssetBatchSize(),
    });
  } catch (error) {
    return {
      attempted: 0,
      stored: 0,
      skipped: 0,
      failed: 1,
      errorMessage: getCaughtErrorMessage(error),
    } satisfies TeamFlagAssetResult;
  }
}

function getFlagAssetBatchSize() {
  const configuredBatchSize = Number(process.env.FLAG_ASSET_SYNC_BATCH_SIZE);

  return Number.isFinite(configuredBatchSize) && configuredBatchSize > 0
    ? Math.floor(configuredBatchSize)
    : 48;
}

export function getCaughtErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error != null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return "Unknown football data sync error";
}

export function shouldSkipFootballDataSync(
  lastStartedAt: string,
  now: Date,
  minimumIntervalMs = minimumSyncIntervalMs,
) {
  const lastStartedTime = new Date(lastStartedAt).getTime();

  if (Number.isNaN(lastStartedTime)) {
    return false;
  }

  return now.getTime() - lastStartedTime < minimumIntervalMs;
}

async function loadLatestSyncRun(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("football_data_sync_runs")
    .select("id, started_at")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
