import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleClient } from "@/server/supabase/client";
import type { Database } from "@/server/supabase/database.types";

export type LeaderboardMovementDisplay = "+" | "-" | `+${number}` | `-${number}`;
export type LeaderboardMovementMap = Record<string, LeaderboardMovementDisplay>;
export type LeaderboardSnapshotMovement = {
  officialMovementByParticipantId: LeaderboardMovementMap;
  alternativeMovementByParticipantId: LeaderboardMovementMap;
};

export type SnapshotMovementRow = {
  snapshot_id: string;
  participant_id: string;
  alternative_rank: number;
  official_rank: number;
};

export async function loadLatestLeaderboardSnapshotMovement(
  sweepstakeId: string,
) {
  return loadLatestLeaderboardSnapshotMovementWithClient(
    getSupabaseServiceRoleClient(),
    sweepstakeId,
  );
}

export async function loadLatestLeaderboardSnapshotMovementWithClient(
  supabase: SupabaseClient<Database>,
  sweepstakeId: string,
): Promise<LeaderboardSnapshotMovement> {
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("leaderboard_snapshots")
    .select("id")
    .eq("sweepstake_id", sweepstakeId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (snapshotsError) {
    throw snapshotsError;
  }

  const latestSnapshots = (snapshots ?? []) as Array<{ id: string }>;

  if (latestSnapshots.length < 2) {
    return emptyMovement();
  }

  const latestSnapshotId = latestSnapshots[0]?.id;
  const previousSnapshotId = latestSnapshots[1]?.id;

  if (!latestSnapshotId || !previousSnapshotId) {
    return emptyMovement();
  }

  const { data: rows, error: rowsError } = await supabase
    .from("leaderboard_snapshot_rows")
    .select("snapshot_id, participant_id, alternative_rank, official_rank")
    .in("snapshot_id", [latestSnapshotId, previousSnapshotId]);

  if (rowsError) {
    throw rowsError;
  }

  return buildRankMovements({
    latestSnapshotId,
    previousSnapshotId,
    rows: (rows ?? []) as SnapshotMovementRow[],
  });
}

export function buildRankMovements(input: {
  latestSnapshotId: string;
  previousSnapshotId: string;
  rows: SnapshotMovementRow[];
}): LeaderboardSnapshotMovement {
  const previousRowsByParticipant = new Map(
    input.rows
      .filter((row) => row.snapshot_id === input.previousSnapshotId)
      .map((row) => [row.participant_id, row]),
  );
  const latestRows = input.rows.filter(
    (row) => row.snapshot_id === input.latestSnapshotId,
  );

  return {
    officialMovementByParticipantId: Object.fromEntries(
      latestRows.map((latestRow) => {
        const previousRow = previousRowsByParticipant.get(
          latestRow.participant_id,
        );
        const movement = previousRow
          ? formatRankMovement(previousRow.official_rank - latestRow.official_rank)
          : "-";

        return [latestRow.participant_id, movement];
      }),
    ),
    alternativeMovementByParticipantId: Object.fromEntries(
      latestRows.map((latestRow) => {
        const previousRow = previousRowsByParticipant.get(
          latestRow.participant_id,
        );
        const movement = previousRow
          ? formatRankMovement(
              previousRow.alternative_rank - latestRow.alternative_rank,
            )
          : "-";

        return [latestRow.participant_id, movement];
      }),
    ),
  };
}

export function buildAlternativeRankMovement(input: {
  latestSnapshotId: string;
  previousSnapshotId: string;
  rows: SnapshotMovementRow[];
}): LeaderboardMovementMap {
  return buildRankMovements(input).alternativeMovementByParticipantId;
}

export function buildOfficialRankMovement(input: {
  latestSnapshotId: string;
  previousSnapshotId: string;
  rows: SnapshotMovementRow[];
}): LeaderboardMovementMap {
  return buildRankMovements(input).officialMovementByParticipantId;
}

export function formatRankMovement(delta: number): LeaderboardMovementDisplay {
  if (delta > 0) {
    return `+${delta}`;
  }

  if (delta < 0) {
    return `${delta}` as `-${number}`;
  }

  return "-";
}

function emptyMovement(): LeaderboardSnapshotMovement {
  return {
    officialMovementByParticipantId: {},
    alternativeMovementByParticipantId: {},
  };
}
