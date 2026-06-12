import "server-only";

import type { Json } from "@/server/supabase/database.types";
import type {
  SyncDiagnosticRun,
  SyncDiagnostics,
} from "@/features/admin/sync-diagnostics-types";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";

import {
  scheduledFullSyncIntervalMinutes,
  scheduledMatchSyncIntervalMinutes,
} from "./sync";

type SyncRunRow = {
  id: string;
  status: "started" | "succeeded" | "failed";
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  metadata: Json;
};

export async function loadSyncDiagnostics(
  tournamentCodes: string[],
  now = new Date(),
): Promise<Record<string, SyncDiagnostics>> {
  const uniqueTournamentCodes = [...new Set(tournamentCodes)];

  if (uniqueTournamentCodes.length === 0) {
    return {};
  }

  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("football_data_sync_runs")
    .select("id, status, started_at, finished_at, error_message, metadata")
    .order("started_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return Object.fromEntries(
    uniqueTournamentCodes.map((tournamentCode) => {
      const runs = ((data ?? []) as SyncRunRow[]).filter(
        (run) => readString(run.metadata, "tournamentCode") === tournamentCode,
      );
      return [
        tournamentCode,
        buildSyncDiagnostics(tournamentCode, runs, now),
      ];
    }),
  );
}

export function buildSyncDiagnostics(
  tournamentCode: string,
  runs: SyncRunRow[],
  now: Date,
): SyncDiagnostics {
  const successfulRuns = runs.filter((run) => run.status === "succeeded");
  const lastSuccessfulMatchSyncAt =
    successfulRuns[0]?.finished_at ?? successfulRuns[0]?.started_at ?? null;
  const fullRun = successfulRuns.find(
    (run) => readString(run.metadata, "syncMode") === "full",
  );
  const lastSuccessfulFullSyncAt =
    fullRun?.finished_at ?? fullRun?.started_at ?? null;
  const latestFailedRun = runs.find((run) => run.status === "failed");
  const latestError =
    latestFailedRun &&
    (!lastSuccessfulMatchSyncAt ||
      new Date(latestFailedRun.started_at) >
        new Date(lastSuccessfulMatchSyncAt))
      ? latestFailedRun.error_message
      : null;

  return {
    tournamentCode,
    schedule: "Every 5 minutes",
    matchIntervalMinutes: scheduledMatchSyncIntervalMinutes,
    fullIntervalMinutes: scheduledFullSyncIntervalMinutes,
    health: getSyncHealth({
      lastSuccessfulMatchSyncAt,
      latestError,
      now,
    }),
    lastSuccessfulMatchSyncAt,
    lastSuccessfulFullSyncAt,
    latestError,
    recentRuns: runs.slice(0, 10).map(toDiagnosticRun),
  };
}

function toDiagnosticRun(run: SyncRunRow): SyncDiagnosticRun {
  const trigger = readString(run.metadata, "trigger");
  const syncMode = readString(run.metadata, "syncMode");
  const transitions = readArray(run.metadata, "matchTransitions");

  return {
    id: run.id,
    status: run.status,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    trigger:
      trigger === "scheduled" || trigger === "manual" ? trigger : "unknown",
    syncMode:
      syncMode === "matches" || syncMode === "full" ? syncMode : "unknown",
    apiRequestCount: readNumber(run.metadata, "apiRequestCount"),
    transitionCount: transitions.length,
    errorMessage: run.error_message,
  };
}

function getSyncHealth(input: {
  lastSuccessfulMatchSyncAt: string | null;
  latestError: string | null;
  now: Date;
}): SyncDiagnostics["health"] {
  if (input.latestError) {
    return "failing";
  }

  if (!input.lastSuccessfulMatchSyncAt) {
    return "awaiting";
  }

  const ageMinutes =
    (input.now.getTime() -
      new Date(input.lastSuccessfulMatchSyncAt).getTime()) /
    60_000;

  if (ageMinutes > 20) {
    return "stale";
  }

  if (ageMinutes > 10) {
    return "delayed";
  }

  return "healthy";
}

function readRecord(metadata: Json) {
  return typeof metadata === "object" &&
    metadata != null &&
    !Array.isArray(metadata)
    ? metadata
    : {};
}

function readString(metadata: Json, key: string) {
  const value = readRecord(metadata)[key];
  return typeof value === "string" ? value : null;
}

function readNumber(metadata: Json, key: string) {
  const value = readRecord(metadata)[key];
  return typeof value === "number" ? value : null;
}

function readArray(metadata: Json, key: string) {
  const value = readRecord(metadata)[key];
  return Array.isArray(value) ? value : [];
}
