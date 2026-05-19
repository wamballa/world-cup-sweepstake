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
  it("allocates all 48 teams evenly when participant count divides 48", () => {
    const people = participants(8);
    const allocations = createFairAllocation(people, teams, fixedRandom);
    const spread = getAllocationSpread(
      people.map((participant) => participant.id),
      allocations,
    );

    expect(allocations).toHaveLength(48);
    expect(spread).toEqual({ min: 6, max: 6 });
    expect(validateCompleteAllocation(people, teams, allocations)).toBe(true);
  });

  it("keeps uneven allocations within one team", () => {
    const people = participants(7);
    const allocations = createFairAllocation(people, teams, fixedRandom);
    const spread = getAllocationSpread(
      people.map((participant) => participant.id),
      allocations,
    );

    expect(spread).toEqual({ min: 6, max: 7 });
    expect(spread.max - spread.min).toBeLessThanOrEqual(1);
    expect(validateCompleteAllocation(people, teams, allocations)).toBe(true);
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
