import { describe, expect, it } from "vitest";

import type { SharedBoardData } from "./shared-board-data";
import {
  buildCountdownAllocations,
  buildCountdownParticipantAllocations,
  getTournamentCountdownTarget,
} from "./countdown-page-data";

const boardData: SharedBoardData = {
  sweepstakeId: "sweepstake-1",
  sweepstakeName: "Office Draw",
  tournamentCode: "WC_2026",
  sharedViewMode: "countdown",
  participants: [
    { id: "participant-1", name: "Maya", emailUpdatesEnabled: false },
    { id: "participant-2", name: "Theo", emailUpdatesEnabled: false },
  ],
  standings: [
    {
      participantId: "participant-1",
      name: "Maya",
      rank: 1,
      points: 0,
      teamCount: 1,
      teamIds: ["team-a"],
      teamNames: ["Argentina"],
    },
    {
      participantId: "participant-2",
      name: "Theo",
      rank: 1,
      points: 0,
      teamCount: 1,
      teamIds: ["team-b"],
      teamNames: ["Brazil"],
    },
  ],
  teams: [
    {
      id: "team-a",
      name: "Argentina",
      shortName: "ARG",
      group: "A",
      status: "group",
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      allocatedTo: "participant-1",
      allocatedToName: "Maya",
      flagAssetPath: "https://example.test/argentina.svg",
    },
    {
      id: "team-b",
      name: "Brazil",
      shortName: "BRA",
      group: "B",
      status: "group",
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      allocatedTo: "participant-2",
      allocatedToName: "Theo",
      flagAssetPath: "https://example.test/brazil.svg",
    },
  ],
  matches: [
    {
      id: "match-later",
      stage: "Group Stage",
      status: "scheduled",
      homeTeamId: "team-a",
      awayTeamId: "team-b",
      homeTeamName: "Argentina",
      awayTeamName: "Brazil",
      homeParticipantName: "Maya",
      awayParticipantName: "Theo",
      participantLabel: "Maya & Theo",
      homeScore: null,
      awayScore: null,
      kickoffAt: "2026-06-15T20:00:00Z",
      kickoffLabel: "15 Jun 2026, 21:00",
      freshness: "scheduled",
    },
    {
      id: "match-first",
      stage: "Group Stage",
      status: "scheduled",
      homeTeamId: "team-b",
      awayTeamId: "team-a",
      homeTeamName: "Brazil",
      awayTeamName: "Argentina",
      homeParticipantName: "Theo",
      awayParticipantName: "Maya",
      participantLabel: "Theo & Maya",
      homeScore: null,
      awayScore: null,
      kickoffAt: "2026-06-11T18:00:00Z",
      kickoffLabel: "11 Jun 2026, 19:00",
      freshness: "scheduled",
    },
  ],
  badges: [],
  syncState: {
    lastSuccessfulSyncAt: null,
    freshnessLabel: "Awaiting first sync",
    freshnessStatus: "awaiting",
    freshnessNotice: "Awaiting the first football-data.org check.",
  },
  summary: {
    leaderName: "Maya",
    finalMatchCount: 0,
    delayedMatchCount: 0,
    scheduledMatchCount: 2,
    totalGoals: 0,
    activeTeamCount: 2,
    hasFinalMatches: false,
  },
};

describe("countdown page data", () => {
  it("uses the first cached kickoff as the tournament countdown target", () => {
    expect(getTournamentCountdownTarget(boardData)).toBe("2026-06-11T18:00:00Z");
  });

  it("builds allocation cards with first match opponent and participant matchup", () => {
    const allocations = buildCountdownAllocations(boardData);

    expect(allocations[0]).toMatchObject({
      participantName: "Maya",
      teamName: "Argentina",
      firstMatch: {
        kickoffAt: "2026-06-11T18:00:00Z",
        opponentTeamName: "Brazil",
        opponentParticipantName: "Theo",
        participantLabel: "Theo & Maya",
      },
    });
  });

  it("groups countdown allocations by participant", () => {
    const participantAllocations = buildCountdownParticipantAllocations({
      ...boardData,
      teams: [
        ...boardData.teams,
        {
          id: "team-c",
          name: "Canada",
          shortName: "CAN",
          group: "C",
          status: "group",
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          allocatedTo: "participant-1",
          allocatedToName: "Maya",
          flagAssetPath: "https://example.test/canada.svg",
        },
      ],
      standings: boardData.standings.map((standing) =>
        standing.participantId === "participant-1"
          ? {
              ...standing,
              teamCount: 2,
              teamIds: ["team-a", "team-c"],
              teamNames: ["Argentina", "Canada"],
            }
          : standing,
      ),
    });

    expect(participantAllocations[0]).toMatchObject({
      participantName: "Maya",
      teams: [
        { teamName: "Argentina", teamShortName: "ARG" },
        { teamName: "Canada", teamShortName: "CAN" },
      ],
    });
    expect(participantAllocations[1]).toMatchObject({
      participantName: "Theo",
      teams: [{ teamName: "Brazil", teamShortName: "BRA" }],
    });
  });
});
