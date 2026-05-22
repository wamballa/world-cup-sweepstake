import { describe, expect, it } from "vitest";

import {
  buildSharedBoardData,
  type SharedBoardMapperInput,
} from "./shared-board-data";

const baseTeams = [
  {
    id: "team-a",
    name: "Argentina",
    short_name: "ARG",
    group_name: "A",
  },
  {
    id: "team-b",
    name: "Brazil",
    short_name: "BRA",
    group_name: "B",
  },
];

function boardInput(
  overrides: Partial<SharedBoardMapperInput> = {},
): SharedBoardMapperInput {
  return {
    sweepstake: {
      id: "sweepstake-1",
      name: "Team1",
      tournament_code: "WC_2026",
    },
    participants: [
      {
        id: "participant-1",
        display_name: "Maya",
        sort_order: 0,
      },
      {
        id: "participant-2",
        display_name: "Theo",
        sort_order: 1,
      },
    ],
    participantEmailPreferences: [
      {
        participant_id: "participant-1",
        update_opt_in: true,
      },
    ],
    allocations: [
      {
        participant_id: "participant-1",
        team_id: "team-a",
      },
      {
        participant_id: "participant-2",
        team_id: "team-b",
      },
    ],
    teams: baseTeams,
    teamScores: [
      {
        team_id: "team-a",
        points: 3,
      },
      {
        team_id: "team-b",
        points: 1,
      },
    ],
    participantScores: [
      {
        participant_id: "participant-1",
        points: 3,
        rank: 1,
        team_count: 1,
      },
      {
        participant_id: "participant-2",
        points: 1,
        rank: 2,
        team_count: 1,
      },
    ],
    badgeCategories: [
      {
        id: "badge-first",
        key: "first-place",
        label: "1st Place",
        status: "active",
        sort_order: 0,
        is_enabled: true,
      },
    ],
    badgeHolders: [
      {
        badge_category_id: "badge-first",
        participant_id: "participant-1",
        team_id: null,
        reason: "Shared rank 1 with 3 points.",
      },
    ],
    matches: [],
    syncState: null,
    ...overrides,
  };
}

describe("shared board data mapper", () => {
  it("keeps different sweepstakes scoped to their own participants and allocations", () => {
    const firstBoard = buildSharedBoardData(boardInput());
    const secondBoard = buildSharedBoardData(
      boardInput({
        sweepstake: {
          id: "sweepstake-2",
          name: "Team2",
          tournament_code: "WC_2026",
        },
        participants: [
          {
            id: "participant-3",
            display_name: "Alex",
            sort_order: 0,
          },
          {
            id: "participant-4",
            display_name: "Priya",
            sort_order: 1,
          },
        ],
        participantEmailPreferences: [],
        allocations: [
          {
            participant_id: "participant-3",
            team_id: "team-b",
          },
          {
            participant_id: "participant-4",
            team_id: "team-a",
          },
        ],
        participantScores: [],
      }),
    );

    expect(firstBoard.sweepstakeName).toBe("Team1");
    expect(secondBoard.sweepstakeName).toBe("Team2");
    expect(firstBoard.standings.map((standing) => standing.name)).toEqual([
      "Maya",
      "Theo",
    ]);
    expect(secondBoard.standings.map((standing) => standing.name)).toEqual([
      "Priya",
      "Alex",
    ]);
    expect(secondBoard.standings[0].teamNames).toEqual(["Argentina"]);
    expect(secondBoard.teams.find((team) => team.id === "team-a")).toMatchObject({
      allocatedTo: "participant-4",
      allocatedToName: "Priya",
    });
  });

  it("adds participant labels to matches from team allocations", () => {
    const board = buildSharedBoardData(
      boardInput({
        matches: [
          {
            id: "match-1",
            stage: "GROUP_STAGE",
            status: "scheduled",
            home_team_id: "team-a",
            away_team_id: "team-b",
            home_score: null,
            away_score: null,
            kickoff_at: null,
            data_freshness: "scheduled",
          },
        ],
      }),
    );

    expect(board.matches[0]).toMatchObject({
      homeParticipantName: "Maya",
      awayParticipantName: "Theo",
      participantLabel: "Maya & Theo",
    });
  });

  it("sorts matches by kickoff date with unscheduled fixtures last", () => {
    const board = buildSharedBoardData(
      boardInput({
        matches: [
          {
            id: "match-tbc",
            stage: "FINAL",
            status: "scheduled",
            home_team_id: "team-a",
            away_team_id: "team-b",
            home_score: null,
            away_score: null,
            kickoff_at: null,
            data_freshness: "scheduled",
          },
          {
            id: "match-later",
            stage: "GROUP_STAGE",
            status: "scheduled",
            home_team_id: "team-a",
            away_team_id: "team-b",
            home_score: null,
            away_score: null,
            kickoff_at: "2026-06-20T20:00:00Z",
            data_freshness: "scheduled",
          },
          {
            id: "match-first",
            stage: "GROUP_STAGE",
            status: "scheduled",
            home_team_id: "team-a",
            away_team_id: "team-b",
            home_score: null,
            away_score: null,
            kickoff_at: "2026-06-12T20:00:00Z",
            data_freshness: "scheduled",
          },
        ],
      }),
    );

    expect(board.matches.map((match) => match.id)).toEqual([
      "match-first",
      "match-later",
      "match-tbc",
    ]);
  });

  it("falls back to deterministic zero-point standings when scores are absent", () => {
    const board = buildSharedBoardData(
      boardInput({
        teamScores: [],
        participantScores: [],
      }),
    );

    expect(board.standings).toMatchObject([
      {
        name: "Maya",
        rank: 1,
        points: 0,
        teamCount: 1,
        teamNames: ["Argentina"],
      },
      {
        name: "Theo",
        rank: 1,
        points: 0,
        teamCount: 1,
        teamNames: ["Brazil"],
      },
    ]);
  });

  it("does not include participant email addresses in public board data", () => {
    const board = buildSharedBoardData(boardInput());

    expect(board.participants[0]).toEqual({
      id: "participant-1",
      name: "Maya",
      emailUpdatesEnabled: true,
    });
    expect(board.summary).toMatchObject({
      leaderName: "Maya",
      finalMatchCount: 0,
      delayedMatchCount: 0,
      scheduledMatchCount: 0,
      totalGoals: 0,
      activeTeamCount: 2,
      hasFinalMatches: false,
    });
    expect(JSON.stringify(board)).not.toContain("@");
    expect(JSON.stringify(board)).not.toContain("email@example.com");
  });
});
