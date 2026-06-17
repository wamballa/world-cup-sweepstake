import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ParticipantScore,
  ScoringAllocation,
  ScoringParticipant,
  TeamScore,
} from "@/features/scoring/sweepstake-scoring";
import type { Json } from "@/server/supabase/database.types";

export type LeaderboardSnapshotTrigger =
  | "initial_baseline"
  | "completed_match_change"
  | "manual_recalculation";

export type MatchTransition = {
  matchId: string;
  previousStatus: string;
  nextStatus: string;
  previousScore: [number | null, number | null];
  nextScore: [number | null, number | null];
};

export type RecalculatedSweepstakeSnapshotInput = {
  sweepstakeId: string;
  tournamentCode: string;
  status: string;
  participants: ScoringParticipant[];
  allocations: ScoringAllocation[];
  teamScores: TeamScore[];
  participantScores: ParticipantScore[];
};

export type SnapshotMatchContext = {
  completedMatchCount: number;
  latestCompletedMatchId: string | null;
  changedMatchIds: string[];
  matchTransitionSummary: Json;
};

export type SnapshotDraft = {
  sweepstakeId: string;
  tournamentCode: string;
  syncRunId?: string | null;
  triggerType: LeaderboardSnapshotTrigger;
  snapshotKey: string;
  sourceUpdatedAt?: string | null;
  snapshotReason: string;
  completedMatchCount: number;
  latestCompletedMatchId?: string | null;
  changedMatchIds: string[];
  matchTransitionSummary: Json;
  rows: SnapshotRowDraft[];
};

export type SnapshotRowDraft = {
  participantId: string;
  participantName: string;
  officialRank: number;
  officialPoints: number;
  officialTeamCount: number;
  officialTeamIds: string[];
  alternativeRank: number;
  alternativeScore: number;
  alternativeTotalPoints: number;
  alternativeTeamCount: number;
  alternativeTeamIds: string[];
};

type CachedChangedMatch = {
  id: string;
  external_id: string | null;
  kickoff_at: string | null;
  status: string;
};

export async function captureLeaderboardSnapshots(
  supabase: SupabaseClient,
  input: {
    recalculatedSweepstakes: RecalculatedSweepstakeSnapshotInput[];
    tournamentCode: string;
    sourceUpdatedAt: string;
    syncRunId?: string | null;
    matchTransitions: MatchTransition[];
  },
) {
  const sharedSweepstakes = input.recalculatedSweepstakes.filter(
    (sweepstake) => sweepstake.status === "shared",
  );

  if (sharedSweepstakes.length === 0) {
    return { created: 0 };
  }

  const meaningfulTransitions = getMeaningfulCompletedMatchTransitions(
    input.matchTransitions,
  );
  const matchContext =
    meaningfulTransitions.length > 0
      ? await buildSnapshotMatchContext(supabase, {
          tournamentCode: input.tournamentCode,
          matchTransitions: meaningfulTransitions,
        })
      : emptyMatchContext();
  let created = 0;

  for (const sweepstake of sharedSweepstakes) {
    const hasExistingSnapshot = await hasSnapshotForSweepstake(
      supabase,
      sweepstake.sweepstakeId,
    );

    if (!hasExistingSnapshot) {
      const baseline = buildLeaderboardSnapshotDraft({
        sweepstake,
        triggerType: "initial_baseline",
        snapshotKey: "initial-baseline",
        syncRunId: input.syncRunId,
        sourceUpdatedAt: input.sourceUpdatedAt,
        matchContext: emptyMatchContext(),
        snapshotReason: "Initial leaderboard baseline from current cached scores.",
      });

      if (await insertLeaderboardSnapshot(supabase, baseline)) {
        created += 1;
      }

      continue;
    }

    if (meaningfulTransitions.length === 0) {
      continue;
    }

    const snapshotKey = buildCompletedMatchSnapshotKey({
      syncRunId: input.syncRunId,
      matchTransitions: meaningfulTransitions,
    });
    const snapshot = buildLeaderboardSnapshotDraft({
      sweepstake,
      triggerType: "completed_match_change",
      snapshotKey,
      syncRunId: input.syncRunId,
      sourceUpdatedAt: input.sourceUpdatedAt,
      matchContext,
      snapshotReason: "Leaderboard snapshot after completed match or final score change.",
    });

    if (await insertLeaderboardSnapshot(supabase, snapshot)) {
      created += 1;
    }
  }

  return { created };
}

export function buildLeaderboardSnapshotDraft(input: {
  sweepstake: RecalculatedSweepstakeSnapshotInput;
  triggerType: LeaderboardSnapshotTrigger;
  snapshotKey: string;
  syncRunId?: string | null;
  sourceUpdatedAt?: string | null;
  snapshotReason: string;
  matchContext: SnapshotMatchContext;
}): SnapshotDraft {
  return {
    sweepstakeId: input.sweepstake.sweepstakeId,
    tournamentCode: input.sweepstake.tournamentCode,
    syncRunId: input.syncRunId ?? null,
    triggerType: input.triggerType,
    snapshotKey: input.snapshotKey,
    sourceUpdatedAt: input.sourceUpdatedAt ?? null,
    snapshotReason: input.snapshotReason,
    completedMatchCount: input.matchContext.completedMatchCount,
    latestCompletedMatchId: input.matchContext.latestCompletedMatchId,
    changedMatchIds: input.matchContext.changedMatchIds,
    matchTransitionSummary: input.matchContext.matchTransitionSummary,
    rows: buildSnapshotRows(input.sweepstake),
  };
}

export function buildLeaderboardSnapshotInsert(snapshot: SnapshotDraft) {
  return {
    sweepstake_id: snapshot.sweepstakeId,
    tournament_code: snapshot.tournamentCode,
    sync_run_id: snapshot.syncRunId ?? null,
    trigger_type: snapshot.triggerType,
    snapshot_key: snapshot.snapshotKey,
    completed_match_count: snapshot.completedMatchCount,
    latest_completed_match_id: snapshot.latestCompletedMatchId ?? null,
    changed_match_ids: snapshot.changedMatchIds,
    match_transition_summary: snapshot.matchTransitionSummary,
    source_updated_at: snapshot.sourceUpdatedAt ?? null,
    snapshot_reason: snapshot.snapshotReason,
  };
}

export function buildLeaderboardSnapshotRowInserts(
  snapshotId: string,
  rows: SnapshotRowDraft[],
) {
  return rows.map((row) => ({
    snapshot_id: snapshotId,
    participant_id: row.participantId,
    participant_name: row.participantName,
    official_rank: row.officialRank,
    official_points: row.officialPoints,
    official_team_count: row.officialTeamCount,
    official_team_ids: row.officialTeamIds,
    alternative_rank: row.alternativeRank,
    alternative_score: row.alternativeScore,
    alternative_total_points: row.alternativeTotalPoints,
    alternative_team_count: row.alternativeTeamCount,
    alternative_team_ids: row.alternativeTeamIds,
  }));
}

export function getMeaningfulCompletedMatchTransitions(
  transitions: MatchTransition[],
) {
  return transitions.filter((transition) => {
    if (transition.nextStatus !== "final") {
      return false;
    }

    if (transition.previousStatus !== "final") {
      return true;
    }

    return (
      transition.previousScore[0] !== transition.nextScore[0] ||
      transition.previousScore[1] !== transition.nextScore[1]
    );
  });
}

export function buildCompletedMatchSnapshotKey(input: {
  syncRunId?: string | null;
  matchTransitions: MatchTransition[];
}) {
  const source = JSON.stringify(
    input.matchTransitions.map((transition) => ({
      matchId: transition.matchId,
      previousStatus: transition.previousStatus,
      nextStatus: transition.nextStatus,
      previousScore: transition.previousScore,
      nextScore: transition.nextScore,
    })),
  );
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 16);

  return `sync:${input.syncRunId ?? "unknown"}:${hash}`;
}

function buildSnapshotRows(
  sweepstake: RecalculatedSweepstakeSnapshotInput,
): SnapshotRowDraft[] {
  const officialScores = new Map(
    sweepstake.participantScores.map((score) => [score.participantId, score]),
  );
  const alternativeScores = new Map(
    buildAlternativeSnapshotRows(sweepstake).map((row) => [
      row.participantId,
      row,
    ]),
  );

  return sweepstake.participants.map((participant) => {
    const official = officialScores.get(participant.id);
    const alternative = alternativeScores.get(participant.id);

    return {
      participantId: participant.id,
      participantName: participant.name,
      officialRank: official?.rank ?? 0,
      officialPoints: official?.points ?? 0,
      officialTeamCount: official?.teamCount ?? 0,
      officialTeamIds: official?.teamIds ?? [],
      alternativeRank: alternative?.rank ?? 0,
      alternativeScore: alternative?.alternativeScore ?? 0,
      alternativeTotalPoints: alternative?.alternativeTotalPoints ?? 0,
      alternativeTeamCount: alternative?.alternativeTeamCount ?? 0,
      alternativeTeamIds: alternative?.alternativeTeamIds ?? [],
    };
  });
}

function buildAlternativeSnapshotRows(
  sweepstake: RecalculatedSweepstakeSnapshotInput,
) {
  const pointsByTeam = new Map(
    sweepstake.teamScores.map((score) => [score.teamId, score.points]),
  );
  const rows = sweepstake.participants.map((participant) => {
    const teamIds = sweepstake.allocations
      .filter((allocation) => allocation.participantId === participant.id)
      .map((allocation) => allocation.teamId);
    const alternativeTotalPoints = teamIds.reduce(
      (total, teamId) => total + (pointsByTeam.get(teamId) ?? 0),
      0,
    );
    const alternativeTeamCount = teamIds.length;
    const alternativeScore =
      alternativeTeamCount > 0
        ? alternativeTotalPoints / alternativeTeamCount
        : 0;

    return {
      participantId: participant.id,
      alternativeTotalPoints,
      alternativeTeamCount,
      alternativeTeamIds: teamIds,
      alternativeScore,
      roundedAlternativeScore: roundAlternativeScore(alternativeScore),
    };
  });
  const sortedRows = rows.sort(
    (a, b) =>
      b.roundedAlternativeScore - a.roundedAlternativeScore ||
      (sweepstake.participants.find((participant) => participant.id === a.participantId)
        ?.name ?? ""
      ).localeCompare(
        sweepstake.participants.find((participant) => participant.id === b.participantId)
          ?.name ?? "",
      ),
  );
  let lastRoundedScore: number | null = null;
  let lastRank = 0;

  return sortedRows.map((row, index) => {
    if (row.roundedAlternativeScore !== lastRoundedScore) {
      lastRank = index + 1;
      lastRoundedScore = row.roundedAlternativeScore;
    }

    return {
      ...row,
      rank: lastRank,
    };
  });
}

function roundAlternativeScore(score: number) {
  return Math.round(score * 10) / 10;
}

async function insertLeaderboardSnapshot(
  supabase: SupabaseClient,
  snapshot: SnapshotDraft,
) {
  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .insert(buildLeaderboardSnapshotInsert(snapshot))
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return false;
    }

    throw error;
  }

  if (snapshot.rows.length === 0) {
    return true;
  }

  const { error: rowsError } = await supabase
    .from("leaderboard_snapshot_rows")
    .insert(buildLeaderboardSnapshotRowInserts(data.id, snapshot.rows));

  if (rowsError) {
    throw rowsError;
  }

  return true;
}

async function hasSnapshotForSweepstake(
  supabase: SupabaseClient,
  sweepstakeId: string,
) {
  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("id")
    .eq("sweepstake_id", sweepstakeId)
    .limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

async function buildSnapshotMatchContext(
  supabase: SupabaseClient,
  input: {
    tournamentCode: string;
    matchTransitions: MatchTransition[];
  },
): Promise<SnapshotMatchContext> {
  const externalIds = input.matchTransitions.map((transition) => transition.matchId);
  const { data, error } = await supabase
    .from("matches")
    .select("id, external_id, kickoff_at, status")
    .eq("tournament_code", input.tournamentCode)
    .in("external_id", externalIds);

  if (error) {
    throw error;
  }

  const matches = (data ?? []) as CachedChangedMatch[];
  const finalMatches = matches.filter((match) => match.status === "final");
  const latestCompletedMatch =
    finalMatches.sort((a, b) => {
      const aTime = a.kickoff_at ? new Date(a.kickoff_at).getTime() : 0;
      const bTime = b.kickoff_at ? new Date(b.kickoff_at).getTime() : 0;

      return bTime - aTime;
    })[0] ?? null;

  return {
    completedMatchCount: finalMatches.length,
    latestCompletedMatchId: latestCompletedMatch?.id ?? null,
    changedMatchIds: matches.map((match) => match.id),
    matchTransitionSummary: input.matchTransitions as unknown as Json,
  };
}

function emptyMatchContext(): SnapshotMatchContext {
  return {
    completedMatchCount: 0,
    latestCompletedMatchId: null,
    changedMatchIds: [],
    matchTransitionSummary: [],
  };
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    error.code === "23505"
  );
}
