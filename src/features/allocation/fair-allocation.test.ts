import { describe, expect, it } from "vitest";

import {
  createFairAllocation,
  getAllocationSpread,
  moveAllocatedTeam,
  validateCompleteAllocation,
} from "./fair-allocation";

const teams = Array.from({ length: 48 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: `Team ${index + 1}`,
}));

function participants(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `participant-${index + 1}`,
    name: `Participant ${index + 1}`,
  }));
}

function fixedRandom() {
  return 0.42;
}

describe("fair allocation", () => {
  it.each([
    { participantCount: 1, expectedSpread: { min: 48, max: 48 } },
    { participantCount: 2, expectedSpread: { min: 24, max: 24 } },
    { participantCount: 24, expectedSpread: { min: 2, max: 2 } },
    { participantCount: 48, expectedSpread: { min: 1, max: 1 } },
  ])(
    "allocates all 48 teams evenly for $participantCount participants",
    ({ participantCount, expectedSpread }) => {
      const people = participants(participantCount);
      const allocations = createFairAllocation(people, teams, fixedRandom);
      const spread = getAllocationSpread(
        people.map((participant) => participant.id),
        allocations,
      );

      expect(allocations).toHaveLength(48);
      expect(spread).toEqual(expectedSpread);
      expect(validateCompleteAllocation(people, teams, allocations)).toBe(true);
    },
  );

  it.each([
    { participantCount: 7, expectedSpread: { min: 6, max: 7 } },
    { participantCount: 47, expectedSpread: { min: 1, max: 2 } },
    { participantCount: 49, expectedSpread: { min: 0, max: 1 } },
  ])(
    "keeps uneven allocations within one team for $participantCount participants",
    ({ participantCount, expectedSpread }) => {
      const people = participants(participantCount);
      const allocations = createFairAllocation(people, teams, fixedRandom);
      const spread = getAllocationSpread(
        people.map((participant) => participant.id),
        allocations,
      );

      expect(allocations).toHaveLength(48);
      expect(spread).toEqual(expectedSpread);
      expect(spread.max - spread.min).toBeLessThanOrEqual(1);
      expect(validateCompleteAllocation(people, teams, allocations)).toBe(true);
    },
  );

  it("does not duplicate participants or teams when the draw is uneven", () => {
    const people = participants(49);
    const allocations = createFairAllocation(people, teams, fixedRandom);
    const allocatedTeamIds = new Set(allocations.map((allocation) => allocation.teamId));
    const allocatedParticipantIds = new Set(
      allocations.map((allocation) => allocation.participantId),
    );

    expect(allocatedTeamIds.size).toBe(48);
    expect(allocatedParticipantIds.size).toBe(48);
    expect(validateCompleteAllocation(people, teams, allocations)).toBe(true);
  });

  it("allocates a historical 32-team World Cup season evenly", () => {
    const historicalTeams = teams.slice(0, 32);
    const people = participants(10);
    const allocations = createFairAllocation(people, historicalTeams, fixedRandom);
    const spread = getAllocationSpread(
      people.map((participant) => participant.id),
      allocations,
    );

    expect(allocations).toHaveLength(32);
    expect(spread).toEqual({ min: 3, max: 4 });
    expect(validateCompleteAllocation(people, historicalTeams, allocations)).toBe(
      true,
    );
  });

  it("moves a team without unassigning or duplicating it", () => {
    const people = participants(4);
    const allocations = createFairAllocation(people, teams, fixedRandom);
    const moved = moveAllocatedTeam(allocations, "team-1", "participant-4");
    const teamOneAllocation = moved.find(
      (allocation) => allocation.teamId === "team-1",
    );

    expect(teamOneAllocation?.participantId).toBe("participant-4");
    expect(validateCompleteAllocation(people, teams, moved)).toBe(true);
  });

  it("rejects allocation with no participants", () => {
    expect(() => createFairAllocation([], teams, fixedRandom)).toThrow(
      "At least one participant is required.",
    );
  });
});
