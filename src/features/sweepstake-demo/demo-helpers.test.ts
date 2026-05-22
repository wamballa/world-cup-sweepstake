import { describe, expect, it } from "vitest";

import { formatParticipantCapacity, getProjectedSpread } from "./demo-helpers";

describe("admin sweepstake team count helpers", () => {
  it("formats participant capacity from the cached team count", () => {
    expect(formatParticipantCapacity(8, 48)).toBe("8/48");
    expect(formatParticipantCapacity(8, 46)).toBe("8/46");
  });

  it("falls back to participant count before teams have synced", () => {
    expect(formatParticipantCapacity(8, 0)).toBe("8");
  });

  it("projects fair split from dynamic synced team totals", () => {
    expect(getProjectedSpread(8, 48)).toEqual({ min: 6, max: 6 });
    expect(getProjectedSpread(8, 46)).toEqual({ min: 5, max: 6 });
  });
});
