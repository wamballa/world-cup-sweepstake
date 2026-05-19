import { describe, expect, it } from "vitest";

import {
  getParticipantStandings,
  mockBadges,
  mockDataSummary,
  mockMatches,
  mockParticipants,
  mockTeams,
} from "./world-cup-2026";

describe("mock World Cup 2026 sweepstake data", () => {
  it("seeds all 48 mock tournament teams", () => {
    expect(mockTeams).toHaveLength(48);
    expect(new Set(mockTeams.map((team) => team.id)).size).toBe(48);
  });

  it("keeps mock allocations fair across participants", () => {
    expect(mockParticipants.length).toBeGreaterThan(0);
    expect(mockDataSummary.allocationSpread.max - mockDataSummary.allocationSpread.min).toBeLessThanOrEqual(1);
  });

  it("includes matches, badge states, and ranked standings", () => {
    expect(mockMatches.some((match) => match.status === "final")).toBe(true);
    expect(mockMatches.some((match) => match.status === "delayed")).toBe(true);
    expect(mockBadges.some((badge) => badge.status === "manual-future")).toBe(true);
    expect(getParticipantStandings()[0]).toMatchObject({
      rank: 1,
      teamCount: 6,
    });
  });
});
