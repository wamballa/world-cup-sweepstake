import { describe, expect, it } from "vitest";

import {
  calculateBadgeHolders,
  calculateParticipantScores,
  calculateTeamScore,
  calculateTeamScores,
  normalizeBadgeCategoryKey,
  type BadgeCategoryInput,
  type ScoringAllocation,
  type ScoringParticipant,
  type TeamPerformanceInput,
} from "./sweepstake-scoring";

const teams: TeamPerformanceInput[] = [
  {
    teamId: "team-winner",
    name: "Winner",
    groupStageWins: 2,
    groupStageDraws: 1,
    reachedStage: "winner",
    goalsFor: 8,
    goalsAgainst: 2,
    cards: 4,
  },
  {
    teamId: "team-runner-up",
    name: "Runner Up",
    groupStageWins: 1,
    groupStageDraws: 2,
    reachedStage: "runner-up",
    goalsFor: 6,
    goalsAgainst: 3,
    cards: 7,
  },
  {
    teamId: "team-eliminated-first",
    name: "First Out",
    groupStageWins: 0,
    groupStageDraws: 0,
    reachedStage: "group",
    goalsFor: 1,
    goalsAgainst: 9,
    cards: 3,
    eliminatedOrder: 1,
  },
  {
    teamId: "team-low-goals",
    name: "Low Goals",
    groupStageWins: 0,
    groupStageDraws: 1,
    reachedStage: "group",
    goalsFor: 1,
    goalsAgainst: 5,
    cards: 7,
    eliminatedOrder: 2,
  },
];

const participants: ScoringParticipant[] = [
  { id: "participant-a", name: "Ava" },
  { id: "participant-b", name: "Ben" },
  { id: "participant-c", name: "Cara" },
];

const allocations: ScoringAllocation[] = [
  { participantId: "participant-a", teamId: "team-winner" },
  { participantId: "participant-b", teamId: "team-runner-up" },
  { participantId: "participant-c", teamId: "team-eliminated-first" },
  { participantId: "participant-c", teamId: "team-low-goals" },
];

const categories: BadgeCategoryInput[] = [
  { id: "badge-first", key: "first-place", label: "1st Place" },
  { id: "badge-second", key: "second-place", label: "2nd Place" },
  { id: "badge-wooden", key: "wooden-spoon", label: "Wooden Spoon" },
  {
    id: "badge-first-out",
    key: "first-knocked-out",
    label: "First Knocked Out",
  },
  {
    id: "badge-conceded",
    key: "most-goals-conceded",
    label: "Most Goals Conceded",
  },
  {
    id: "badge-fewest",
    key: "fewest-goals-scored",
    label: "Fewest Goals Scored",
  },
  { id: "badge-cards", key: "most-cards", label: "Most Cards" },
  {
    id: "badge-future",
    key: "most-cards",
    label: "Future Most Cards",
    status: "manual-future",
  },
];

describe("sweepstake scoring", () => {
  it("calculates default team performance points", () => {
    expect(calculateTeamScore(teams[0])).toEqual({
      teamId: "team-winner",
      points: 32,
      breakdown: {
        groupStageWins: 2,
        groupStageDraws: 1,
        groupStageWinPoints: 6,
        groupStageDrawPoints: 1,
        progressionPoints: 25,
      },
    });
  });

  it("calculates participant totals and shared ranks from allocations", () => {
    const tiedTeamScores = [
      { teamId: "team-winner", points: 10, breakdown: emptyBreakdown() },
      { teamId: "team-runner-up", points: 10, breakdown: emptyBreakdown() },
      {
        teamId: "team-eliminated-first",
        points: 2,
        breakdown: emptyBreakdown(),
      },
      { teamId: "team-low-goals", points: 1, breakdown: emptyBreakdown() },
    ];

    expect(
      calculateParticipantScores(participants, allocations, tiedTeamScores),
    ).toEqual([
      {
        participantId: "participant-a",
        name: "Ava",
        rank: 1,
        points: 10,
        teamCount: 1,
        teamIds: ["team-winner"],
      },
      {
        participantId: "participant-b",
        name: "Ben",
        rank: 1,
        points: 10,
        teamCount: 1,
        teamIds: ["team-runner-up"],
      },
      {
        participantId: "participant-c",
        name: "Cara",
        rank: 3,
        points: 3,
        teamCount: 2,
        teamIds: ["team-eliminated-first", "team-low-goals"],
      },
    ]);
  });

  it("calculates MVP badge holders without AI or external data", () => {
    const teamScores = calculateTeamScores(teams);
    const participantScores = calculateParticipantScores(
      participants,
      allocations,
      teamScores,
    );
    const holders = calculateBadgeHolders({
      categories,
      participantScores,
      teams,
      allocations,
    });

    expect(holders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          badgeCategoryId: "badge-first",
          participantId: "participant-a",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-second",
          participantId: "participant-b",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-wooden",
          participantId: "participant-c",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-first-out",
          participantId: "participant-c",
          teamId: "team-eliminated-first",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-conceded",
          participantId: "participant-c",
          teamId: "team-eliminated-first",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-fewest",
          participantId: "participant-c",
          teamId: "team-eliminated-first",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-fewest",
          participantId: "participant-c",
          teamId: "team-low-goals",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-cards",
          participantId: "participant-b",
          teamId: "team-runner-up",
        }),
        expect.objectContaining({
          badgeCategoryId: "badge-cards",
          participantId: "participant-c",
          teamId: "team-low-goals",
        }),
      ]),
    );
    expect(
      holders.some((holder) => holder.badgeCategoryId === "badge-future"),
    ).toBe(false);
  });

  it("normalizes legacy placement badge keys for existing sweepstakes", () => {
    expect(normalizeBadgeCategoryKey("fourth")).toBe("fourth-place");

    const participantScores = calculateParticipantScores(
      participants,
      allocations,
      calculateTeamScores(teams),
    );
    const holders = calculateBadgeHolders({
      categories: [
        { id: "legacy-first", key: "first", label: "1st Place" },
        { id: "legacy-second", key: "second", label: "2nd Place" },
        { id: "legacy-third", key: "third", label: "3rd Place" },
      ],
      participantScores,
      teams,
      allocations,
    });

    expect(holders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          badgeCategoryId: "legacy-first",
          participantId: "participant-a",
        }),
        expect.objectContaining({
          badgeCategoryId: "legacy-second",
          participantId: "participant-b",
        }),
        expect.objectContaining({
          badgeCategoryId: "legacy-third",
          participantId: "participant-c",
        }),
      ]),
    );
  });
});

function emptyBreakdown() {
  return {
    groupStageWins: 0,
    groupStageDraws: 0,
    groupStageWinPoints: 0,
    groupStageDrawPoints: 0,
    progressionPoints: 0,
  };
}
