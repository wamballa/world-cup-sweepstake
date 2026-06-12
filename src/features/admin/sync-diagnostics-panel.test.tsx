import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SyncDiagnosticsPanel } from "./sync-diagnostics-panel";

describe("sync diagnostics panel", () => {
  it("renders sanitized admin sync evidence", () => {
    render(
      <SyncDiagnosticsPanel
        diagnostics={{
          tournamentCode: "WC_2026",
          schedule: "Every 5 minutes",
          matchIntervalMinutes: 5,
          fullIntervalMinutes: 30,
          health: "healthy",
          lastSuccessfulMatchSyncAt: "2026-06-12T21:10:10.000Z",
          lastSuccessfulFullSyncAt: "2026-06-12T21:00:20.000Z",
          latestError: null,
          recentRuns: [
            {
              id: "run-1",
              status: "succeeded",
              startedAt: "2026-06-12T21:10:00.000Z",
              finishedAt: "2026-06-12T21:10:10.000Z",
              trigger: "scheduled",
              syncMode: "matches",
              apiRequestCount: 1,
              transitionCount: 1,
              errorMessage: null,
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Football data diagnostics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Every 5 minutes")).toBeInTheDocument();
    expect(screen.getByText("1 changes")).toBeInTheDocument();
    expect(screen.queryByText(/token|secret|raw payload/i)).not.toBeInTheDocument();
  });
});
