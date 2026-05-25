import { describe, expect, it } from "vitest";

import {
  buildMatchInserts,
  buildTeamMatchStatInserts,
  isMissingCompositeConflictError,
} from "./cache";

describe("football-data cache builders", () => {
  it("maps external team IDs to cached match foreign keys", () => {
    const rows = buildMatchInserts(
      [
        {
          external_id: "5001",
          tournament_code: "WC_2026",
          stage: "GROUP_STAGE",
          status: "final",
          home_team_external_id: "101",
          away_team_external_id: "102",
          home_score: 2,
          away_score: 1,
          kickoff_at: "2026-06-15T20:00:00Z",
          data_freshness: "final",
          raw_payload: {},
        },
      ],
      new Map([
        ["101", "team-a"],
        ["102", "team-b"],
      ]),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        external_id: "5001",
        home_team_id: "team-a",
        away_team_id: "team-b",
        data_freshness: "final",
      }),
    ]);
  });

  it("drops team stat rows when required cached IDs are missing", () => {
    const rows = buildTeamMatchStatInserts(
      [
        {
          match_external_id: "5001",
          team_external_id: "101",
          goals_for: 2,
          goals_against: 1,
          cards: null,
          raw_payload: {},
        },
        {
          match_external_id: "missing",
          team_external_id: "101",
          goals_for: 1,
          goals_against: 0,
          cards: null,
          raw_payload: {},
        },
      ],
      new Map([["101", "team-a"]]),
      new Map([["5001", "match-a"]]),
    );

    expect(rows).toEqual([
      {
        match_id: "match-a",
        team_id: "team-a",
        goals_for: 2,
        goals_against: 1,
        cards: null,
        raw_payload: {},
      },
    ]);
  });

  it("detects hosted databases missing tournament-scoped conflict indexes", () => {
    expect(
      isMissingCompositeConflictError({
        code: "42P10",
        message: "there is no unique or exclusion constraint matching",
      }),
    ).toBe(true);
    expect(isMissingCompositeConflictError({ code: "23505" })).toBe(false);
  });
});
