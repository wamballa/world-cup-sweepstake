import { describe, expect, it } from "vitest";

import {
  buildBadgeHolderInserts,
  buildParticipantScoreInserts,
  buildTeamScoreInserts,
  type PersistScoresInput,
} from "./scores";

const input: PersistScoresInput = {
  sweepstakeId: "sweepstake-1",
  teamScores: [
    {
      teamId: "team-1",
      points: 8,
      scoringBreakdown: { groupWins: 1, reachedRoundOf16: true },
      sourceUpdatedAt: "2026-06-15T12:00:00.000Z",
    },
  ],
  participantScores: [
    {
      participantId: "participant-1",
      points: 21,
      rank: 1,
      teamCount: 6,
      sourceUpdatedAt: "2026-06-15T12:00:00.000Z",
    },
  ],
  badgeHolders: [
    {
      badgeCategoryId: "badge-1",
      participantId: "participant-1",
      reason: "Highest recalculated score.",
      sourceUpdatedAt: "2026-06-15T12:00:00.000Z",
    },
  ],
};

describe("Supabase score persistence builders", () => {
  it("builds team score rows with recalculation metadata", () => {
    expect(buildTeamScoreInserts(input)).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        team_id: "team-1",
        points: 8,
        scoring_breakdown: { groupWins: 1, reachedRoundOf16: true },
        source_updated_at: "2026-06-15T12:00:00.000Z",
      },
    ]);
  });

  it("builds participant score rows with ranks and team counts", () => {
    expect(buildParticipantScoreInserts(input)).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        participant_id: "participant-1",
        points: 21,
        rank: 1,
        team_count: 6,
        source_updated_at: "2026-06-15T12:00:00.000Z",
      },
    ]);
  });

  it("builds badge holder rows without needing AI or external calls", () => {
    expect(buildBadgeHolderInserts(input)).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        badge_category_id: "badge-1",
        participant_id: "participant-1",
        team_id: null,
        reason: "Highest recalculated score.",
        source_updated_at: "2026-06-15T12:00:00.000Z",
      },
    ]);
  });
});
