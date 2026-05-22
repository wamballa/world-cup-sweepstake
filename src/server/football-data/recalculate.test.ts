import { describe, expect, it } from "vitest";

import { buildTeamPerformances } from "./recalculate";

describe("football-data score recalculation inputs", () => {
  it("derives group results, goals, and reached stage from cached matches", () => {
    const performances = buildTeamPerformances(
      [
        { id: "team-a", name: "Aurora Republic" },
        { id: "team-b", name: "Bayside Union" },
      ],
      [
        {
          id: "match-1",
          stage: "GROUP_STAGE",
          status: "final",
          home_team_id: "team-a",
          away_team_id: "team-b",
          home_score: 2,
          away_score: 1,
          kickoff_at: "2026-06-15T20:00:00Z",
        },
        {
          id: "match-2",
          stage: "FINAL",
          status: "final",
          home_team_id: "team-a",
          away_team_id: "team-b",
          home_score: 3,
          away_score: 2,
          kickoff_at: "2026-07-19T20:00:00Z",
        },
      ],
    );

    expect(performances).toEqual([
      {
        teamId: "team-a",
        name: "Aurora Republic",
        groupStageWins: 1,
        groupStageDraws: 0,
        reachedStage: "winner",
        goalsFor: 5,
        goalsAgainst: 3,
        cards: null,
        eliminatedOrder: null,
      },
      {
        teamId: "team-b",
        name: "Bayside Union",
        groupStageWins: 0,
        groupStageDraws: 0,
        reachedStage: "runner-up",
        goalsFor: 3,
        goalsAgainst: 5,
        cards: null,
        eliminatedOrder: null,
      },
    ]);
  });
});
