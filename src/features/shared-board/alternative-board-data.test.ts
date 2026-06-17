import { describe, expect, it } from "vitest";

import { buildAlternativeBoardRows, formatAlternativeScore } from "./alternative-board-data";
import type { SharedBoardData } from "./shared-board-data";

function boardData(overrides: Partial<SharedBoardData> = {}): SharedBoardData {
  return {
    sweepstakeId: "sweepstake-1",
    sweepstakeName: "Office Draw",
    tournamentCode: "WC_2026",
    sharedViewMode: "participant_board",
    participants: [
      {
        id: "andy",
        name: "Andy",
        emailUpdatesEnabled: false,
      },
      {
        id: "jobin",
        name: "Jobin",
        emailUpdatesEnabled: false,
      },
    ],
    standings: [],
    teams: [
      {
        id: "japan",
        name: "Japan",
        shortName: "JPN",
        group: "C",
        status: "group",
        points: 74,
        goalsFor: 0,
        goalsAgainst: 0,
        allocatedTo: "andy",
        allocatedToName: "Andy",
        flagAssetPath: null,
      },
      {
        id: "norway",
        name: "Norway",
        shortName: "NOR",
        group: "D",
        status: "group",
        points: 49,
        goalsFor: 0,
        goalsAgainst: 0,
        allocatedTo: "jobin",
        allocatedToName: "Jobin",
        flagAssetPath: null,
      },
      {
        id: "scotland",
        name: "Scotland",
        shortName: "SCO",
        group: "E",
        status: "group",
        points: 34,
        goalsFor: 0,
        goalsAgainst: 0,
        allocatedTo: "jobin",
        allocatedToName: "Jobin",
        flagAssetPath: null,
      },
    ],
    matches: [],
    badges: [],
    syncState: {
      lastSuccessfulSyncAt: null,
      freshnessLabel: "Awaiting first sync",
      freshnessStatus: "awaiting",
      freshnessNotice: "Awaiting the first football-data.org check.",
    },
    summary: {
      leaderName: null,
      finalMatchCount: 0,
      delayedMatchCount: 0,
      scheduledMatchCount: 0,
      totalGoals: 0,
      activeTeamCount: 0,
      hasFinalMatches: false,
    },
    ...overrides,
  };
}

describe("alternative board data", () => {
  it("normalizes one-team and two-team participants by average score", () => {
    expect(buildAlternativeBoardRows(boardData())).toMatchObject([
      {
        participantId: "andy",
        rank: 1,
        totalOfficialTeamScore: 74,
        assignedTeamCount: 1,
        alternativeScore: 74,
        displayAlternativeScore: "74",
      },
      {
        participantId: "jobin",
        rank: 2,
        totalOfficialTeamScore: 83,
        assignedTeamCount: 2,
        alternativeScore: 41.5,
        displayAlternativeScore: "41.5",
      },
    ]);
  });

  it("shares ranks when rounded displayed alternative scores match", () => {
    const rows = buildAlternativeBoardRows(
      boardData({
        participants: [
          {
            id: "a",
            name: "Ava",
            emailUpdatesEnabled: false,
          },
          {
            id: "b",
            name: "Ben",
            emailUpdatesEnabled: false,
          },
          {
            id: "c",
            name: "Cara",
            emailUpdatesEnabled: false,
          },
        ],
        teams: [
          team("a-1", "A One", 100.04, "a"),
          team("b-1", "B One", 100.03, "b"),
          team("c-1", "C One", 99.8, "c"),
        ],
      }),
    );

    expect(rows.map((row) => [row.name, row.rank, row.displayAlternativeScore])).toEqual([
      ["Ava", 1, "100"],
      ["Ben", 1, "100"],
      ["Cara", 3, "99.8"],
    ]);
  });

  it("treats missing team scores as zero through the shared board data shape", () => {
    const rows = buildAlternativeBoardRows(
      boardData({
        participants: [
          {
            id: "maya",
            name: "Maya",
            emailUpdatesEnabled: false,
          },
        ],
        teams: [team("unknown-score", "Unknown Score", 0, "maya")],
      }),
    );

    expect(rows[0]).toMatchObject({
      totalOfficialTeamScore: 0,
      assignedTeamCount: 1,
      alternativeScore: 0,
      displayAlternativeScore: "0",
    });
  });

  it("guards against participants with no valid assigned teams", () => {
    const rows = buildAlternativeBoardRows(
      boardData({
        participants: [
          {
            id: "late",
            name: "Late Entrant",
            emailUpdatesEnabled: false,
          },
        ],
        teams: [],
      }),
    );

    expect(rows[0]).toMatchObject({
      totalOfficialTeamScore: 0,
      assignedTeamCount: 0,
      alternativeScore: 0,
      displayAlternativeScore: "0",
    });
  });

  it("formats whole and decimal alternative scores cleanly", () => {
    expect(formatAlternativeScore(42)).toBe("42");
    expect(formatAlternativeScore(41.5)).toBe("41.5");
    expect(formatAlternativeScore(41.54)).toBe("41.5");
    expect(formatAlternativeScore(41.55)).toBe("41.6");
  });
});

function team(
  id: string,
  name: string,
  points: number,
  allocatedTo: string,
): SharedBoardData["teams"][number] {
  return {
    id,
    name,
    shortName: name
      .split(" ")
      .map((part) => part[0])
      .join(""),
    group: null,
    status: "group",
    points,
    goalsFor: 0,
    goalsAgainst: 0,
    allocatedTo,
    allocatedToName: allocatedTo,
    flagAssetPath: null,
  };
}
