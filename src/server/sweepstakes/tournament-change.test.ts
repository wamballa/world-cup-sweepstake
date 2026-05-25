import { describe, expect, it } from "vitest";

import {
  buildHistoricalTournamentSyncFailureMessage,
  buildTournamentChangePatch,
  buildTournamentResetAuditInsert,
  tournamentDependentSweepstakeTables,
} from "./tournament-change";

describe("sweepstake tournament changes", () => {
  it("clears tournament-dependent rows without clearing participants or admins", () => {
    expect(tournamentDependentSweepstakeTables).toEqual([
      "team_allocations",
      "team_scores",
      "participant_scores",
      "badge_holders",
      "ai_generations",
      "email_update_logs",
    ]);
    expect(tournamentDependentSweepstakeTables).not.toContain("participants");
    expect(tournamentDependentSweepstakeTables).not.toContain("sweepstake_admins");
  });

  it("builds an auditable reset event and returns the sweepstake to draft", () => {
    expect(buildTournamentChangePatch("PL_2024")).toEqual({
      tournament_code: "PL_2024",
      status: "draft",
    });
    expect(
      buildTournamentResetAuditInsert({
        sweepstakeId: "sweepstake-1",
        actorUserId: "admin-1",
        previousTournamentCode: "WC_2026",
        previousTournamentLabel: "FIFA World Cup 2026",
        nextTournamentCode: "PL_2024",
        nextTournamentLabel: "Premier League 2024/25 validation",
      }),
    ).toEqual({
      sweepstake_id: "sweepstake-1",
      action: "rerun",
      actor_user_id: "admin-1",
      note: "Tournament changed from FIFA World Cup 2026 to Premier League 2024/25 validation. Existing draw and derived results were reset.",
      metadata: {
        actionKind: "tournament_reset",
        previousTournamentCode: "WC_2026",
        nextTournamentCode: "PL_2024",
      },
    });
  });

  it("explains API access failures without implying the dataset changed", () => {
    expect(
      buildHistoricalTournamentSyncFailureMessage({
        tournamentLabel: "Premier League 2024/25 validation",
        errorMessage: "football-data.org request failed with 403",
      }),
    ).toBe(
      "football-data.org rejected Premier League 2024/25 validation with 403. Your current API plan or token does not allow that dataset, so the sweepstake stayed on its current tournament and no draw was reset.",
    );
  });
});
