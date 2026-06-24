import { describe, expect, it } from "vitest";

import {
  buildAlternativeRankMovement,
  buildOfficialRankMovement,
  buildRankMovements,
  formatRankMovement,
  loadLatestLeaderboardSnapshotMovementWithClient,
  type SnapshotMovementRow,
} from "./leaderboard-snapshot-movement";

describe("leaderboard snapshot movement", () => {
  it("returns no movements when only one snapshot exists", async () => {
    const supabase = {
      from(table: string) {
        expect(table).toBe("leaderboard_snapshots");

        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return Promise.resolve({
              data: [{ id: "snapshot-1" }],
              error: null,
            });
          },
        };
      },
    };

    await expect(
      loadLatestLeaderboardSnapshotMovementWithClient(
        supabase as never,
        "sweepstake-1",
      ),
    ).resolves.toEqual({
      officialMovementByParticipantId: {},
      alternativeMovementByParticipantId: {},
    });
  });

  it("formats upward, downward, and unchanged rank movement", () => {
    expect(formatRankMovement(2)).toBe("+2");
    expect(formatRankMovement(-3)).toBe("-3");
    expect(formatRankMovement(0)).toBe("-");
  });

  it("calculates movement from alternative ranks", () => {
    expect(
      buildAlternativeRankMovement({
        latestSnapshotId: "latest",
        previousSnapshotId: "previous",
        rows: rows([
          {
            snapshot_id: "previous",
            participant_id: "andy",
            alternative_rank: 4,
            official_rank: 1,
          },
          {
            snapshot_id: "latest",
            participant_id: "andy",
            alternative_rank: 2,
            official_rank: 9,
          },
        ]),
      }),
    ).toEqual({ andy: "+2" });
  });

  it("calculates movement from official ranks", () => {
    expect(
      buildOfficialRankMovement({
        latestSnapshotId: "latest",
        previousSnapshotId: "previous",
        rows: rows([
          {
            snapshot_id: "previous",
            participant_id: "andy",
            alternative_rank: 9,
            official_rank: 4,
          },
          {
            snapshot_id: "latest",
            participant_id: "andy",
            alternative_rank: 1,
            official_rank: 2,
          },
        ]),
      }),
    ).toEqual({ andy: "+2" });
  });

  it("returns official and alternative movement maps from one row set", () => {
    expect(
      buildRankMovements({
        latestSnapshotId: "latest",
        previousSnapshotId: "previous",
        rows: rows([
          {
            snapshot_id: "previous",
            participant_id: "jobin",
            alternative_rank: 2,
            official_rank: 8,
          },
          {
            snapshot_id: "latest",
            participant_id: "jobin",
            alternative_rank: 5,
            official_rank: 3,
          },
        ]),
      }),
    ).toEqual({
      officialMovementByParticipantId: { jobin: "+5" },
      alternativeMovementByParticipantId: { jobin: "-3" },
    });
  });

  it("shows downward movement from alternative ranks", () => {
    expect(
      buildAlternativeRankMovement({
        latestSnapshotId: "latest",
        previousSnapshotId: "previous",
        rows: rows([
          {
            snapshot_id: "previous",
            participant_id: "jobin",
            alternative_rank: 2,
            official_rank: 10,
          },
          {
            snapshot_id: "latest",
            participant_id: "jobin",
            alternative_rank: 5,
            official_rank: 1,
          },
        ]),
      }),
    ).toEqual({ jobin: "-3" });
  });

  it("shows unchanged shared ranks as no movement", () => {
    expect(
      buildAlternativeRankMovement({
        latestSnapshotId: "latest",
        previousSnapshotId: "previous",
        rows: rows([
          {
            snapshot_id: "previous",
            participant_id: "mia",
            alternative_rank: 3,
            official_rank: 1,
          },
          {
            snapshot_id: "latest",
            participant_id: "mia",
            alternative_rank: 3,
            official_rank: 7,
          },
        ]),
      }),
    ).toEqual({ mia: "-" });
  });

  it("shows no movement when a participant is missing from the previous snapshot", () => {
    expect(
      buildAlternativeRankMovement({
        latestSnapshotId: "latest",
        previousSnapshotId: "previous",
        rows: rows([
          {
            snapshot_id: "latest",
            participant_id: "new-player",
            alternative_rank: 1,
            official_rank: 1,
          },
        ]),
      }),
    ).toEqual({ "new-player": "-" });
  });
});

function rows(rows: SnapshotMovementRow[]) {
  return rows;
}
