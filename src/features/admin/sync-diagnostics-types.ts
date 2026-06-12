export type SyncDiagnosticRun = {
  id: string;
  status: "started" | "succeeded" | "failed";
  startedAt: string;
  finishedAt: string | null;
  trigger: "scheduled" | "manual" | "unknown";
  syncMode: "matches" | "full" | "unknown";
  apiRequestCount: number | null;
  transitionCount: number;
  errorMessage: string | null;
};

export type SyncDiagnostics = {
  tournamentCode: string;
  schedule: string;
  matchIntervalMinutes: number;
  fullIntervalMinutes: number;
  health: "healthy" | "delayed" | "stale" | "failing" | "awaiting";
  lastSuccessfulMatchSyncAt: string | null;
  lastSuccessfulFullSyncAt: string | null;
  latestError: string | null;
  recentRuns: SyncDiagnosticRun[];
};
