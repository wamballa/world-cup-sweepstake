import { describe, expect, it } from "vitest";

import { buildSyncDiagnostics } from "./diagnostics";

describe("football-data sync diagnostics", () => {
  it("summarizes healthy runs without exposing arbitrary metadata", () => {
    const diagnostics = buildSyncDiagnostics(
      "WC_2026",
      [
        {
          id: "match-run",
          status: "succeeded",
          started_at: "2026-06-12T21:10:00.000Z",
          finished_at: "2026-06-12T21:10:10.000Z",
          error_message: null,
          metadata: {
            tournamentCode: "WC_2026",
            trigger: "scheduled",
            syncMode: "matches",
            apiRequestCount: 1,
            matchTransitions: [{ matchId: "537333" }],
          },
        },
        {
          id: "full-run",
          status: "succeeded",
          started_at: "2026-06-12T21:00:00.000Z",
          finished_at: "2026-06-12T21:00:20.000Z",
          error_message: null,
          metadata: {
            tournamentCode: "WC_2026",
            trigger: "scheduled",
            syncMode: "full",
            apiRequestCount: 2,
            secret: "must-not-cross-the-client-boundary",
          },
        },
      ],
      new Date("2026-06-12T21:15:00.000Z"),
    );

    expect(diagnostics).toMatchObject({
      health: "healthy",
      schedule: "Every 5 minutes",
      lastSuccessfulMatchSyncAt: "2026-06-12T21:10:10.000Z",
      lastSuccessfulFullSyncAt: "2026-06-12T21:00:20.000Z",
      latestError: null,
    });
    expect(diagnostics.recentRuns[0]).toMatchObject({
      trigger: "scheduled",
      syncMode: "matches",
      apiRequestCount: 1,
      transitionCount: 1,
    });
    expect(JSON.stringify(diagnostics)).not.toContain("secret");
  });

  it("marks a newer failed run as failing and preserves its error", () => {
    const diagnostics = buildSyncDiagnostics(
      "WC_2026",
      [
        {
          id: "failed-run",
          status: "failed",
          started_at: "2026-06-12T21:15:00.000Z",
          finished_at: "2026-06-12T21:15:01.000Z",
          error_message: "football-data.org request failed with 429",
          metadata: {
            tournamentCode: "WC_2026",
            trigger: "scheduled",
            syncMode: "matches",
          },
        },
        {
          id: "successful-run",
          status: "succeeded",
          started_at: "2026-06-12T21:10:00.000Z",
          finished_at: "2026-06-12T21:10:10.000Z",
          error_message: null,
          metadata: {
            tournamentCode: "WC_2026",
            trigger: "scheduled",
            syncMode: "matches",
          },
        },
      ],
      new Date("2026-06-12T21:16:00.000Z"),
    );

    expect(diagnostics.health).toBe("failing");
    expect(diagnostics.latestError).toContain("429");
  });
});
