import { describe, expect, it } from "vitest";

import {
  buildCompletedMatchSnapshotKey,
  buildLeaderboardSnapshotDraft,
  buildLeaderboardSnapshotInsert,
  buildLeaderboardSnapshotRowInserts,
  captureLeaderboardSnapshots,
  getMeaningfulCompletedMatchTransitions,
  type RecalculatedSweepstakeSnapshotInput,
} from "./leaderboard-snapshots";

const sharedSweepstake: RecalculatedSweepstakeSnapshotInput = {
  sweepstakeId: "sweepstake-1",
  tournamentCode: "WC_2026",
  status: "shared",
  participants: [
    { id: "andy", name: "Andy" },
    { id: "jobin", name: "Jobin" },
    { id: "mia", name: "Mia" },
  ],
  allocations: [
    { participantId: "andy", teamId: "japan" },
    { participantId: "jobin", teamId: "norway" },
    { participantId: "jobin", teamId: "scotland" },
    { participantId: "mia", teamId: "canada" },
  ],
  teamScores: [
    { teamId: "japan", points: 74, breakdown: emptyBreakdown() },
    { teamId: "norway", points: 49, breakdown: emptyBreakdown() },
    { teamId: "scotland", points: 34, breakdown: emptyBreakdown() },
    { teamId: "canada", points: 74, breakdown: emptyBreakdown() },
  ],
  participantScores: [
    {
      participantId: "jobin",
      name: "Jobin",
      rank: 1,
      points: 83,
      teamCount: 2,
      teamIds: ["norway", "scotland"],
    },
    {
      participantId: "andy",
      name: "Andy",
      rank: 2,
      points: 74,
      teamCount: 1,
      teamIds: ["japan"],
    },
    {
      participantId: "mia",
      name: "Mia",
      rank: 2,
      points: 74,
      teamCount: 1,
      teamIds: ["canada"],
    },
  ],
};

describe("leaderboard snapshot persistence helpers", () => {
  it("builds snapshot rows with official and alternative ranks", () => {
    const snapshot = buildLeaderboardSnapshotDraft({
      sweepstake: sharedSweepstake,
      triggerType: "initial_baseline",
      snapshotKey: "initial-baseline",
      syncRunId: "sync-run-1",
      sourceUpdatedAt: "2026-06-17T12:00:00.000Z",
      snapshotReason: "Initial leaderboard baseline from current cached scores.",
      matchContext: {
        completedMatchCount: 0,
        latestCompletedMatchId: null,
        changedMatchIds: [],
        matchTransitionSummary: [],
      },
    });

    expect(buildLeaderboardSnapshotInsert(snapshot)).toMatchObject({
      sweepstake_id: "sweepstake-1",
      tournament_code: "WC_2026",
      sync_run_id: "sync-run-1",
      trigger_type: "initial_baseline",
      snapshot_key: "initial-baseline",
    });
    expect(buildLeaderboardSnapshotRowInserts("snapshot-1", snapshot.rows)).toEqual([
      {
        snapshot_id: "snapshot-1",
        participant_id: "andy",
        participant_name: "Andy",
        official_rank: 2,
        official_points: 74,
        official_team_count: 1,
        official_team_ids: ["japan"],
        alternative_rank: 1,
        alternative_score: 74,
        alternative_total_points: 74,
        alternative_team_count: 1,
        alternative_team_ids: ["japan"],
      },
      {
        snapshot_id: "snapshot-1",
        participant_id: "jobin",
        participant_name: "Jobin",
        official_rank: 1,
        official_points: 83,
        official_team_count: 2,
        official_team_ids: ["norway", "scotland"],
        alternative_rank: 3,
        alternative_score: 41.5,
        alternative_total_points: 83,
        alternative_team_count: 2,
        alternative_team_ids: ["norway", "scotland"],
      },
      {
        snapshot_id: "snapshot-1",
        participant_id: "mia",
        participant_name: "Mia",
        official_rank: 2,
        official_points: 74,
        official_team_count: 1,
        official_team_ids: ["canada"],
        alternative_rank: 1,
        alternative_score: 74,
        alternative_total_points: 74,
        alternative_team_count: 1,
        alternative_team_ids: ["canada"],
      },
    ]);
  });

  it("detects only completed-match and final-score changes as meaningful", () => {
    expect(
      getMeaningfulCompletedMatchTransitions([
        {
          matchId: "live-to-final",
          previousStatus: "live",
          nextStatus: "final",
          previousScore: [1, 1],
          nextScore: [1, 1],
        },
        {
          matchId: "final-score-correction",
          previousStatus: "final",
          nextStatus: "final",
          previousScore: [1, 1],
          nextScore: [2, 1],
        },
        {
          matchId: "scheduled-scoreless",
          previousStatus: "scheduled",
          nextStatus: "scheduled",
          previousScore: [null, null],
          nextScore: [null, null],
        },
        {
          matchId: "final-unchanged",
          previousStatus: "final",
          nextStatus: "final",
          previousScore: [2, 1],
          nextScore: [2, 1],
        },
      ]),
    ).toHaveLength(2);
  });

  it("uses a deterministic completed-match snapshot key for duplicate prevention", () => {
    const transitions = [
      {
        matchId: "match-1",
        previousStatus: "live",
        nextStatus: "final",
        previousScore: [1, 1] as [number, number],
        nextScore: [2, 1] as [number, number],
      },
    ];

    expect(
      buildCompletedMatchSnapshotKey({
        syncRunId: "sync-run-1",
        matchTransitions: transitions,
      }),
    ).toBe(
      buildCompletedMatchSnapshotKey({
        syncRunId: "sync-run-1",
        matchTransitions: transitions,
      }),
    );
  });

  it("does not touch Supabase when only draft sweepstakes are recalculated", async () => {
    const result = await captureLeaderboardSnapshots(
      {
        from() {
          throw new Error("draft sweepstakes should not be snapshotted");
        },
      } as never,
      {
        recalculatedSweepstakes: [
          {
            ...sharedSweepstake,
            status: "draft",
          },
        ],
        tournamentCode: "WC_2026",
        sourceUpdatedAt: "2026-06-17T12:00:00.000Z",
        syncRunId: "sync-run-1",
        matchTransitions: [],
      },
    );

    expect(result).toEqual({ created: 0 });
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
