import { describe, expect, it } from "vitest";

import {
  alternativeBoardScoringRules,
  buildAlternativeBadgeRows,
  buildAlternativeBoardRows,
  buildAlternativeTeamBoardRows,
  calculateAlternativeBoardSnapshotTeamPoints,
  formatAlternativeScore,
} from "./alternative-board-data";
import type { SharedBoardData } from "./shared-board-data";

function boardData(overrides: Partial<SharedBoardData> = {}): SharedBoardData {
  return {
    sweepstakeId: "sweepstake-1",
    sweepstakeName: "Office Draw",
    tournamentCode: "WC_2026",
    sharedViewMode: "participant_board",
    boardVariant: "official",
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
        status: "winner",
        points: 32,
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
        status: "runner-up",
        points: 22,
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
        status: "quarter-final",
        points: 14,
        goalsFor: 0,
        goalsAgainst: 0,
        allocatedTo: "jobin",
        allocatedToName: "Jobin",
        flagAssetPath: null,
      },
    ],
    matches: [
      finalMatch("japan-win-1", "japan", 2, 0),
      finalMatch("japan-win-2", "japan", 3, 1),
      finalMatch("japan-draw", "japan", 1, 1),
      finalMatch("norway-win-1", "norway", 2, 0),
      finalMatch("norway-win-2", "norway", 2, 1),
      finalMatch("norway-draw", "norway", 0, 0),
      finalMatch("scotland-win-1", "scotland", 1, 0),
      finalMatch("scotland-win-2", "scotland", 2, 1),
    ],
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
        totalOfficialTeamScore: 107,
        assignedTeamCount: 1,
        alternativeScore: 107,
        displayAlternativeScore: "107",
      },
      {
        participantId: "jobin",
        rank: 2,
        totalOfficialTeamScore: 59,
        assignedTeamCount: 2,
        alternativeScore: 29.5,
        displayAlternativeScore: "29.5",
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
          team("a-1", "A One", 25, "a", { status: "winner" }),
          team("b-1", "B One", 25, "b", { status: "winner" }),
          team("c-1", "C One", 15, "c", { status: "runner-up" }),
        ],
        matches: [],
      }),
    );

    expect(rows.map((row) => [row.name, row.rank, row.displayAlternativeScore])).toEqual([
      ["Ava", 1, "100"],
      ["Ben", 1, "100"],
      ["Cara", 3, "30"],
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

  it("ranks allocated teams by final displayed order", () => {
    const rows = buildAlternativeTeamBoardRows(
      boardData({
        teams: [
          team("argentina", "Argentina", 25, "andy", { status: "winner" }),
          team("brazil", "Brazil", 15, "jobin", { status: "runner-up" }),
          team("canada", "Canada", 0, "andy"),
          {
            ...team("unallocated", "Unallocated", 99, "nobody"),
            allocatedTo: null,
            allocatedToName: null,
          },
        ],
        matches: [],
      }),
    );

    expect(rows.map((row) => [row.teamName, row.rank, row.points])).toEqual([
      ["Argentina", 1, 100],
      ["Brazil", 2, 30],
      ["Canada", 3, 0],
    ]);
  });

  it("uses revised Alternative Board knockout bonuses without changing official points", () => {
    expect(alternativeBoardScoringRules).toMatchObject({
      groupStageWin: 3,
      groupStageDraw: 1,
      progression: {
        "round-of-16": 10,
        "quarter-final": 16,
        "semi-final": 24,
        "runner-up": 30,
        winner: 100,
      },
    });
    expect(
      buildAlternativeTeamBoardRows(
        boardData({
          teams: [
            team("winner", "Winner", 32, "andy", { status: "winner" }),
            team("group-high", "Group High", 9, "jobin"),
          ],
          matches: [
            finalMatch("winner-win-1", "winner", 2, 0),
            finalMatch("winner-win-2", "winner", 2, 1),
            finalMatch("winner-draw", "winner", 1, 1),
            finalMatch("group-high-win-1", "group-high", 3, 0),
            finalMatch("group-high-win-2", "group-high", 2, 0),
            finalMatch("group-high-win-3", "group-high", 1, 0),
          ],
        }),
      ).map((row) => [row.teamName, row.points]),
    ).toEqual([
      ["Winner", 107],
      ["Group High", 9],
    ]);
  });

  it("maps official snapshot scoring breakdowns to revised Alternative Board bonuses", () => {
    expect(
      calculateAlternativeBoardSnapshotTeamPoints({
        teamId: "winner",
        points: 32,
        breakdown: {
          groupStageWins: 2,
          groupStageDraws: 1,
          groupStageWinPoints: 6,
          groupStageDrawPoints: 1,
          progressionPoints: 25,
        },
      }),
    ).toBe(107);
  });

  it("sorts allocated team ties by status, wins, goal difference, goals for, goals against, and name", () => {
    const rows = buildAlternativeTeamBoardRows(
      boardData({
        teams: [
          team("status", "Status Winner", 10, "andy", { status: "winner" }),
          team("wins", "Wins Team", 10, "andy"),
          team("gd", "Goal Difference Team", 10, "andy"),
          team("gf", "Goals For Team", 10, "andy"),
          team("ga-low", "Goals Against Low", 10, "andy"),
          team("ga-high", "Goals Against High", 10, "andy"),
          team("alpha", "Alpha Team", 10, "andy"),
          team("zulu", "Zulu Team", 10, "andy"),
        ],
        matches: [
          finalMatch("wins-a", "wins", 2, 0),
          finalMatch("wins-b", "wins", 1, 0),
          finalMatch("gd-a", "gd", 3, 0),
          finalMatch("gf-a", "gf", 5, 3),
          finalMatch("ga-low-a", "ga-low", 3, 1),
          finalMatch("ga-high-a", "ga-high", 4, 2),
        ],
      }),
    );

    expect(rows.map((row) => row.teamName)).toEqual([
      "Status Winner",
      "Wins Team",
      "Goal Difference Team",
      "Goals For Team",
      "Goals Against High",
      "Goals Against Low",
      "Alpha Team",
      "Zulu Team",
    ]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("derives team record and goals from final matches only", () => {
    const rows = buildAlternativeTeamBoardRows(
      boardData({
        teams: [
          team("japan", "Japan", 6, "andy"),
          team("norway", "Norway", 3, "jobin"),
        ],
        matches: [
          match({
            id: "final-win",
            status: "final",
            homeTeamId: "japan",
            homeTeamName: "Japan",
            awayTeamId: "norway",
            awayTeamName: "Norway",
            homeScore: 2,
            awayScore: 1,
          }),
          match({
            id: "scheduled-ignored",
            status: "scheduled",
            homeTeamId: "japan",
            homeTeamName: "Japan",
            awayTeamId: "norway",
            awayTeamName: "Norway",
            homeScore: null,
            awayScore: null,
          }),
        ],
      }),
    );

    expect(rows[0]).toMatchObject({
      teamName: "Japan",
      wins: 1,
      draws: 0,
      losses: 0,
      goalsFor: 2,
      goalsAgainst: 1,
      goalDifference: 1,
    });
    expect(rows[1]).toMatchObject({
      teamName: "Norway",
      wins: 0,
      draws: 0,
      losses: 1,
      goalsFor: 1,
      goalsAgainst: 2,
      goalDifference: -1,
    });
  });

  it("finds the earliest non-final next fixture", () => {
    const rows = buildAlternativeTeamBoardRows(
      boardData({
        teams: [
          team("japan", "Japan", 6, "andy"),
          team("norway", "Norway", 3, "jobin"),
        ],
        matches: [
          match({
            id: "later",
            status: "scheduled",
            homeTeamId: "japan",
            homeTeamName: "Japan",
            awayTeamId: "Norway",
            awayTeamName: "Norway",
            kickoffAt: "2026-06-21T20:00:00.000Z",
            kickoffLabel: "21 Jun 2026, 20:00",
          }),
          match({
            id: "earlier",
            status: "scheduled",
            homeTeamId: "norway",
            homeTeamName: "Norway",
            awayTeamId: "japan",
            awayTeamName: "Japan",
            kickoffAt: "2026-06-20T20:00:00.000Z",
            kickoffLabel: "20 Jun 2026, 20:00",
          }),
        ],
      }),
    );

    expect(rows.find((row) => row.teamName === "Japan")?.nextFixture).toBe(
      "v Norway (20 Jun 2026, 20:00)",
    );
    expect(rows.find((row) => row.teamName === "Norway")?.nextFixture).toBe(
      "v Japan (20 Jun 2026, 20:00)",
    );
  });

  it("calculates hidden alternative board badges from team-level rows", () => {
    const rows = buildAlternativeBadgeRows(
      boardData({
        badges: [
          badge("badge-first", "1st Place"),
          badge("badge-second", "2nd Place"),
          badge("badge-third", "3rd Place"),
          badge("badge-fourth", "4th Place"),
          badge("badge-wooden", "Wooden Spoon"),
          badge("badge-first-out", "First Knocked Out"),
          badge("badge-conceded", "Most Goals Conceded"),
          badge("badge-fewest", "Fewest Goals Scored"),
        ],
        teams: [
          team("argentina", "Argentina", 10, "andy", {
            allocatedToName: "Andy",
            status: "winner",
          }),
          team("brazil", "Brazil", 8, "jobin", {
            allocatedToName: "Jobin",
            status: "runner-up",
          }),
          team("canada", "Canada", 6, "andy", {
            allocatedToName: "Andy",
            status: "semi-final",
          }),
          team("denmark", "Denmark", 4, "jobin", {
            allocatedToName: "Jobin",
            status: "quarter-final",
          }),
          team("ecuador", "Ecuador", 2, "andy", {
            allocatedToName: "Andy",
            status: "round-of-16",
          }),
          team("fiji", "Fiji", 0, "jobin", {
            allocatedToName: "Jobin",
          }),
        ],
        matches: [
          match({
            id: "arg-bra",
            status: "final",
            homeTeamId: "argentina",
            homeTeamName: "Argentina",
            awayTeamId: "brazil",
            awayTeamName: "Brazil",
            homeScore: 3,
            awayScore: 2,
          }),
          match({
            id: "can-den",
            status: "final",
            homeTeamId: "canada",
            homeTeamName: "Canada",
            awayTeamId: "denmark",
            awayTeamName: "Denmark",
            homeScore: 5,
            awayScore: 0,
          }),
          match({
            id: "ecu-bra",
            status: "final",
            homeTeamId: "ecuador",
            homeTeamName: "Ecuador",
            awayTeamId: "brazil",
            awayTeamName: "Brazil",
            homeScore: 1,
            awayScore: 2,
          }),
        ],
      }),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        label: "1st Place",
        holderLabels: ["Andy (Argentina)"],
        supportLine: "Top scoring team.",
      }),
      expect.objectContaining({
        label: "2nd Place",
        holderLabels: ["Jobin (Brazil)"],
        supportLine: "Second highest scoring team.",
      }),
      expect.objectContaining({
        label: "3rd Place",
        holderLabels: ["Andy (Canada)"],
        supportLine: "Third highest scoring team.",
      }),
      expect.objectContaining({
        label: "4th Place",
        holderLabels: ["Jobin (Denmark)"],
        supportLine: "Fourth highest scoring team.",
      }),
      expect.objectContaining({
        label: "Wooden Spoon",
        holderLabels: ["Jobin (Fiji)"],
        supportLine: "Lowest scoring team.",
      }),
      expect.objectContaining({
        label: "First Knocked Out",
        holderLabels: [],
        supportLine: "First team eliminated.",
      }),
      expect.objectContaining({
        label: "Most Goals Conceded",
        holderLabels: ["Jobin (Denmark)"],
        supportLine: "Team with the most goals conceded.",
      }),
      expect.objectContaining({
        label: "Fewest Goals Scored",
        holderLabels: ["Jobin (Denmark)"],
        supportLine: "Team with the fewest goals scored.",
      }),
    ]);
  });
});

function team(
  id: string,
  name: string,
  points: number,
  allocatedTo: string,
  overrides: Partial<SharedBoardData["teams"][number]> = {},
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
    ...overrides,
  };
}

function finalMatch(
  id: string,
  homeTeamId: string,
  homeScore: number,
  awayScore: number,
): SharedBoardData["matches"][number] {
  return match({
    id,
    status: "final",
    homeTeamId,
    homeTeamName: homeTeamId,
    awayTeamId: "opponent",
    awayTeamName: "Opponent",
    homeScore,
    awayScore,
  });
}

function badge(
  id: string,
  label: string,
): SharedBoardData["badges"][number] {
  return {
    id,
    label,
    status: "active",
    holderParticipantIds: [],
    supportLine: "Official support line.",
  };
}

function match(
  overrides: Partial<SharedBoardData["matches"][number]>,
): SharedBoardData["matches"][number] {
  return {
    id: "match",
    stage: "Group",
    status: "scheduled",
    homeTeamId: null,
    awayTeamId: null,
    homeTeamName: "TBC",
    awayTeamName: "TBC",
    homeParticipantName: null,
    awayParticipantName: null,
    participantLabel: "TBC",
    homeScore: null,
    awayScore: null,
    kickoffAt: null,
    kickoffLabel: "Kickoff TBC",
    freshness: "cached",
    ...overrides,
  };
}
