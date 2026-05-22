import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/server/supabase/database.types";

export type TeamScoreDraft = {
  teamId: string;
  points: number;
  scoringBreakdown?: Json;
  sourceUpdatedAt?: string | null;
};

export type ParticipantScoreDraft = {
  participantId: string;
  points: number;
  rank?: number | null;
  teamCount: number;
  sourceUpdatedAt?: string | null;
};

export type BadgeHolderDraft = {
  badgeCategoryId: string;
  participantId?: string | null;
  teamId?: string | null;
  reason?: string | null;
  sourceUpdatedAt?: string | null;
};

export type PersistScoresInput = {
  sweepstakeId: string;
  teamScores: TeamScoreDraft[];
  participantScores: ParticipantScoreDraft[];
  badgeHolders: BadgeHolderDraft[];
};

export function buildTeamScoreInserts(input: PersistScoresInput) {
  return input.teamScores.map((score) => ({
    sweepstake_id: input.sweepstakeId,
    team_id: score.teamId,
    points: score.points,
    scoring_breakdown: score.scoringBreakdown ?? {},
    source_updated_at: score.sourceUpdatedAt ?? null,
  }));
}

export function buildParticipantScoreInserts(input: PersistScoresInput) {
  return input.participantScores.map((score) => ({
    sweepstake_id: input.sweepstakeId,
    participant_id: score.participantId,
    points: score.points,
    rank: score.rank ?? null,
    team_count: score.teamCount,
    source_updated_at: score.sourceUpdatedAt ?? null,
  }));
}

export function buildBadgeHolderInserts(input: PersistScoresInput) {
  return input.badgeHolders.map((holder) => ({
    sweepstake_id: input.sweepstakeId,
    badge_category_id: holder.badgeCategoryId,
    participant_id: holder.participantId ?? null,
    team_id: holder.teamId ?? null,
    reason: holder.reason ?? null,
    source_updated_at: holder.sourceUpdatedAt ?? null,
  }));
}

export async function replacePersistedScores(
  supabase: SupabaseClient,
  input: PersistScoresInput,
) {
  await deleteBySweepstake(supabase, "team_scores", input.sweepstakeId);
  await deleteBySweepstake(supabase, "participant_scores", input.sweepstakeId);
  await deleteBySweepstake(supabase, "badge_holders", input.sweepstakeId);

  if (input.teamScores.length > 0) {
    const { error } = await supabase
      .from("team_scores")
      .insert(buildTeamScoreInserts(input));

    if (error) {
      throw error;
    }
  }

  if (input.participantScores.length > 0) {
    const { error } = await supabase
      .from("participant_scores")
      .insert(buildParticipantScoreInserts(input));

    if (error) {
      throw error;
    }
  }

  if (input.badgeHolders.length > 0) {
    const { error } = await supabase
      .from("badge_holders")
      .insert(buildBadgeHolderInserts(input));

    if (error) {
      throw error;
    }
  }
}

async function deleteBySweepstake(
  supabase: SupabaseClient,
  table: "team_scores" | "participant_scores" | "badge_holders",
  sweepstakeId: string,
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("sweepstake_id", sweepstakeId);

  if (error) {
    throw error;
  }
}
