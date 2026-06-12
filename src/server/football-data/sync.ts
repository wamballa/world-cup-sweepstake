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
  loadCachedMatchSnapshots,
  updateSyncState,
} from "./cache";
import type { NormalizedMatchRow } from "./types";

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
export const scheduledMatchSyncIntervalMinutes = 5;
export const scheduledFullSyncIntervalMinutes = 30;

export type FootballDataSyncMode = "matches" | "full";
export type FootballDataSyncTrigger = "scheduled" | "manual";

export async function runFootballDataSync(options?: {
  supabase?: SupabaseClient;
  client?: FootballDataClient;
  now?: () => Date;
  tournamentCode?: string;
  trigger?: FootballDataSyncTrigger;
  forceFullSync?: boolean;
}): Promise<FootballDataSyncResult> {
  const supabase = options?.supabase ?? getSupabaseServiceRoleClient();
  const now = options?.now ?? (() => new Date());
  const tournament = getFootballDataTournamentByCode(
    options?.tournamentCode ?? footballDataConfig.tournamentCode,
  );
  const trigger = options?.trigger ?? "manual";
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
  const lastFullSyncAt = await loadLastSuccessfulFullSyncAt(
    supabase,
    tournament.code,
  );
  const syncMode = selectFootballDataSyncMode({
    forceFullSync: options?.forceFullSync ?? trigger === "manual",
    lastFullSyncAt,
    now: now(),
  });
  const metadata = {
    source: "football-data.org",
    competitionCode: tournament.competitionCode,
    season: tournament.season,
    tournamentCode: tournament.code,
    tournamentLabel: tournament.label,
    cadence: "central-polling",
    freeTierFreshness: "delayed-scores-supported",
    providerPlan: "free-delayed-scores",
    trigger,
    syncMode,
    matchSyncIntervalMinutes: scheduledMatchSyncIntervalMinutes,
    fullSyncIntervalMinutes: scheduledFullSyncIntervalMinutes,
    apiRequestCount: syncMode === "full" ? 2 : 1,
    minimumSyncIntervalSeconds: minimumSyncIntervalMs / 1000,
  } satisfies Json;
  const runId = await createSyncRun(supabase, metadata);

  try {
    const { teams, matches } = await fetchFootballDataPayload(client, syncMode);
    const normalized = normalizeFootballDataPayload(
      { teams, matches },
      tournament.code,
    );
    const previousMatches = await loadCachedMatchSnapshots(
      supabase,
      tournament.code,
      normalized.matchRows.map((match) => match.external_id),
    );
    const matchTransitions = buildMatchTransitions(
      previousMatches,
      normalized.matchRows,
    );
    const cacheResult = await cacheFootballData(supabase, {
      teams: normalized.teamRows,
      matches: normalized.matchRows,
      teamStats: normalized.teamStats,
    }, {
      tournamentCode: tournament.code,
    });
    const flagAssetResult =
      syncMode === "full"
        ? await tryCacheTeamFlagAssets(supabase, tournament.code)
        : undefined;
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
      upstreamStatusCounts: countUpstreamStatuses(matches.matches),
      upstreamLatestUpdatedAt: getLatestUpstreamUpdatedAt(matches.matches),
      matchTransitions,
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

export function selectFootballDataSyncMode(input: {
  forceFullSync: boolean;
  lastFullSyncAt: string | null;
  now: Date;
}): FootballDataSyncMode {
  if (input.forceFullSync || !input.lastFullSyncAt) {
    return "full";
  }

  const lastFullSyncTime = new Date(input.lastFullSyncAt).getTime();

  if (Number.isNaN(lastFullSyncTime)) {
    return "full";
  }

  return input.now.getTime() - lastFullSyncTime >=
    scheduledFullSyncIntervalMinutes * 60_000
    ? "full"
    : "matches";
}

export function buildMatchTransitions(
  previousMatches: Array<{
    external_id: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
  }>,
  nextMatches: NormalizedMatchRow[],
) {
  const previousByExternalId = new Map(
    previousMatches.map((match) => [match.external_id, match]),
  );

  return nextMatches.flatMap((match) => {
    const previous = previousByExternalId.get(match.external_id);

    if (
      !previous ||
      (previous.status === match.status &&
        previous.home_score === match.home_score &&
        previous.away_score === match.away_score)
    ) {
      return [];
    }

    return [
      {
        matchId: match.external_id,
        previousStatus: previous.status,
        nextStatus: match.status,
        previousScore: [previous.home_score, previous.away_score],
        nextScore: [match.home_score, match.away_score],
      },
    ];
  });
}

export async function fetchFootballDataPayload(
  client: FootballDataClient,
  syncMode: FootballDataSyncMode,
) {
  const [teams, matches] = await Promise.all([
    syncMode === "full" ? client.getTeams() : Promise.resolve({ teams: [] }),
    client.getMatches(),
  ]);

  return { teams, matches };
}

function countUpstreamStatuses(
  matches: Array<{ status: string }>,
) {
  return matches.reduce<Record<string, number>>((counts, match) => {
    counts[match.status] = (counts[match.status] ?? 0) + 1;
    return counts;
  }, {});
}

function getLatestUpstreamUpdatedAt(
  matches: Array<{ lastUpdated?: string }>,
) {
  return matches.reduce<string | null>((latest, match) => {
    if (!match.lastUpdated) {
      return latest;
    }

    if (!latest || new Date(match.lastUpdated) > new Date(latest)) {
      return match.lastUpdated;
    }

    return latest;
  }, null);
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

async function loadLastSuccessfulFullSyncAt(
  supabase: SupabaseClient,
  tournamentCode: string,
) {
  const { data, error } = await supabase
    .from("football_data_sync_runs")
    .select("finished_at, metadata")
    .eq("status", "succeeded")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  const fullRun = (data ?? []).find((run) => {
    if (
      typeof run.metadata !== "object" ||
      run.metadata == null ||
      Array.isArray(run.metadata)
    ) {
      return false;
    }

    return (
      run.metadata.tournamentCode === tournamentCode &&
      run.metadata.syncMode === "full"
    );
  });

  return fullRun?.finished_at ?? null;
}
