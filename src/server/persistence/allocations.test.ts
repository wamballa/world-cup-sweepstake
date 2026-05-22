import { describe, expect, it } from "vitest";

import {
  buildAllocationAuditInsert,
  buildAllocationInserts,
  type PersistAllocationInput,
} from "./allocations";

const input: PersistAllocationInput = {
  sweepstakeId: "sweepstake-1",
  actorUserId: "user-1",
  action: "rerun",
  note: "48 teams allocated across 8 participants.",
  metadata: { teamCount: 48, participantCount: 8 },
  allocations: [
    { participantId: "participant-1", teamId: "team-1" },
    { participantId: "participant-2", teamId: "team-2" },
  ],
};

describe("Supabase allocation persistence builders", () => {
  it("builds allocation rows scoped to one sweepstake", () => {
    expect(buildAllocationInserts(input)).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        participant_id: "participant-1",
        team_id: "team-1",
      },
      {
        sweepstake_id: "sweepstake-1",
        participant_id: "participant-2",
        team_id: "team-2",
      },
    ]);
  });

  it("builds an auditable allocation event", () => {
    expect(buildAllocationAuditInsert(input)).toEqual({
      sweepstake_id: "sweepstake-1",
      action: "rerun",
      actor_user_id: "user-1",
      note: "48 teams allocated across 8 participants.",
      metadata: { teamCount: 48, participantCount: 8 },
    });
  });
});
