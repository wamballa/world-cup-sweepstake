import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  calculateBadgeHolders,
  calculateParticipantScores,
  calculateTeamScores,
  type BadgeCategoryInput,
  type BadgeCategoryKey,
  type ScoringAllocation,
  type ScoringParticipant,
  type TeamPerformanceInput,
  type TournamentStage,
} from "@/features/scoring/sweepstake-scoring";
import { replacePersistedScores } from "@/server/persistence/scores";
import type { Database } from "@/server/supabase/database.types";

import { footballDataConfig } from "./types";

type CachedTeam = {
  id: string;
  name: string;
};

type CachedMatch = {
  id: string;
  stage: string;
  status: Database["public"]["Enums"]["match_status"];
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
};

const badgeKeys = new Set<BadgeCategoryKey>([
  "first-place",
  "second-place",
  "third-place",
  "fourth-place",
  "wooden-spoon",
  "first-knocked-out",
  "most-goals-conceded",
  "fewest-goals-scored",
  "most-cards",
]);

export async function recalculateAllSweepstakeScores(
  supabase: SupabaseClient,
  sourceUpdatedAt: string,
) {
  const { data: sweepstakes, error: sweepstakesError } = await supabase
    .from("sweepstakes")
    .select("id");

  if (sweepstakesError) {
    throw sweepstakesError;
  }

  const teams = await loadCachedTeams(supabase);
  const matches = await loadCachedMatches(supabase);
  const teamPerformances = buildTeamPerformances(teams, matches);
  const teamScores = calculateTeamScores(teamPerformances);

  let recalculatedCount = 0;

  for (const sweepstake of sweepstakes ?? []) {
    const wasRecalculated = await recalculateSweepstakeScoresWithCachedInputs(
      supabase,
      {
        sweepstakeId: sweepstake.id,
        sourceUpdatedAt,
        teamScores,
        teamPerformances,
      },
    );

    if (!wasRecalculated) {
      continue;
    }

    recalculatedCount += 1;
  }

  return recalculatedCount;
}

export async function recalculateSweepstakeScores(
  supabase: SupabaseClient,
  sweepstakeId: string,
  sourceUpdatedAt: string,
) {
  const teams = await loadCachedTeams(supabase);
  const matches = await loadCachedMatches(supabase);
  const teamPerformances = buildTeamPerformances(teams, matches);
  const teamScores = calculateTeamScores(teamPerformances);

  return recalculateSweepstakeScoresWithCachedInputs(supabase, {
    sweepstakeId,
    sourceUpdatedAt,
    teamScores,
    teamPerformances,
  });
}

async function recalculateSweepstakeScoresWithCachedInputs(
  supabase: SupabaseClient,
  input: {
    sweepstakeId: string;
    sourceUpdatedAt: string;
    teamScores: ReturnType<typeof calculateTeamScores>;
    teamPerformances: TeamPerformanceInput[];
  },
) {
  const [participants, allocations, categories] = await Promise.all([
    loadParticipants(supabase, input.sweepstakeId),
    loadAllocations(supabase, input.sweepstakeId),
    loadBadgeCategories(supabase, input.sweepstakeId),
  ]);

  if (participants.length === 0 || allocations.length === 0) {
    return false;
  }

  const participantScores = calculateParticipantScores(
    participants,
    allocations,
    input.teamScores,
  );
  const badgeHolders = calculateBadgeHolders({
    categories,
    participantScores,
    teams: input.teamPerformances,
    allocations,
  });

  await replacePersistedScores(supabase, {
    sweepstakeId: input.sweepstakeId,
    teamScores: input.teamScores.map((score) => ({
      teamId: score.teamId,
      points: score.points,
      scoringBreakdown: score.breakdown,
      sourceUpdatedAt: input.sourceUpdatedAt,
    })),
    participantScores: participantScores.map((score) => ({
      participantId: score.participantId,
      points: score.points,
      rank: score.rank,
      teamCount: score.teamCount,
      sourceUpdatedAt: input.sourceUpdatedAt,
    })),
    badgeHolders: badgeHolders.map((holder) => ({
      badgeCategoryId: holder.badgeCategoryId,
      participantId: holder.participantId,
      teamId: holder.teamId,
      reason: holder.reason,
      sourceUpdatedAt: input.sourceUpdatedAt,
    })),
  });

  return true;
}

export function buildTeamPerformances(
  teams: CachedTeam[],
  matches: CachedMatch[],
): TeamPerformanceInput[] {
  return teams.map((team) => {
    const finalMatches = matches.filter(
      (match) =>
        match.status === "final" &&
        (match.home_team_id === team.id || match.away_team_id === team.id),
    );
    const groupMatches = finalMatches.filter((match) =>
      isGroupStage(match.stage),
    );
    const groupStageWins = groupMatches.filter((match) =>
      teamWonMatch(team.id, match),
    ).length;
    const groupStageDraws = groupMatches.filter((match) => isDraw(match)).length;

    return {
      teamId: team.id,
      name: team.name,
      groupStageWins,
      groupStageDraws,
      reachedStage: getReachedStage(team.id, finalMatches),
      goalsFor: finalMatches.reduce(
        (total, match) => total + getGoalsFor(team.id, match),
        0,
      ),
      goalsAgainst: finalMatches.reduce(
        (total, match) => total + getGoalsAgainst(team.id, match),
        0,
      ),
      cards: null,
      eliminatedOrder: null,
    };
  });
}

async function loadCachedTeams(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tournament_code", footballDataConfig.tournamentCode);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadCachedMatches(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, stage, status, home_team_id, away_team_id, home_score, away_score, kickoff_at")
    .eq("tournament_code", footballDataConfig.tournamentCode);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadParticipants(
  supabase: SupabaseClient,
  sweepstakeId: string,
): Promise<ScoringParticipant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("id, display_name")
    .eq("sweepstake_id", sweepstakeId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((participant) => ({
    id: participant.id,
    name: participant.display_name,
  }));
}

async function loadAllocations(
  supabase: SupabaseClient,
  sweepstakeId: string,
): Promise<ScoringAllocation[]> {
  const { data, error } = await supabase
    .from("team_allocations")
    .select("participant_id, team_id")
    .eq("sweepstake_id", sweepstakeId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((allocation) => ({
    participantId: allocation.participant_id,
    teamId: allocation.team_id,
  }));
}

async function loadBadgeCategories(
  supabase: SupabaseClient,
  sweepstakeId: string,
): Promise<BadgeCategoryInput[]> {
  const { data, error } = await supabase
    .from("badge_categories")
    .select("id, key, label, status")
    .eq("sweepstake_id", sweepstakeId)
    .eq("is_enabled", true);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((category) => badgeKeys.has(category.key as BadgeCategoryKey))
    .map((category) => ({
      id: category.id,
      key: category.key as BadgeCategoryKey,
      label: category.label,
      status: category.status.replace("_", "-") as BadgeCategoryInput["status"],
    }));
}

function getReachedStage(teamId: string, matches: CachedMatch[]): TournamentStage {
  const final = matches.find((match) => normalizeStage(match.stage) === "final");

  if (final) {
    return teamWonMatch(teamId, final) ? "winner" : "runner-up";
  }

  const stages = matches.map((match) => normalizeStage(match.stage));

  if (stages.includes("semi-final")) {
    return "semi-final";
  }

  if (stages.includes("quarter-final")) {
    return "quarter-final";
  }

  if (stages.includes("round-of-16")) {
    return "round-of-16";
  }

  return "group";
}

function normalizeStage(stage: string): TournamentStage | "final" {
  switch (stage) {
    case "LAST_16":
    case "ROUND_OF_16":
      return "round-of-16";
    case "QUARTER_FINALS":
    case "QUARTER_FINAL":
      return "quarter-final";
    case "SEMI_FINALS":
    case "SEMI_FINAL":
      return "semi-final";
    case "FINAL":
      return "final";
    default:
      return "group";
  }
}

function isGroupStage(stage: string) {
  return stage === "GROUP_STAGE" || normalizeStage(stage) === "group";
}

function teamWonMatch(teamId: string, match: CachedMatch) {
  if (match.home_score == null || match.away_score == null) {
    return false;
  }

  if (match.home_team_id === teamId) {
    return match.home_score > match.away_score;
  }

  if (match.away_team_id === teamId) {
    return match.away_score > match.home_score;
  }

  return false;
}

function isDraw(match: CachedMatch) {
  return (
    match.home_score != null &&
    match.away_score != null &&
    match.home_score === match.away_score
  );
}

function getGoalsFor(teamId: string, match: CachedMatch) {
  if (match.home_team_id === teamId) {
    return match.home_score ?? 0;
  }

  if (match.away_team_id === teamId) {
    return match.away_score ?? 0;
  }

  return 0;
}

function getGoalsAgainst(teamId: string, match: CachedMatch) {
  if (match.home_team_id === teamId) {
    return match.away_score ?? 0;
  }

  if (match.away_team_id === teamId) {
    return match.home_score ?? 0;
  }

  return 0;
}
