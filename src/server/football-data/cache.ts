import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/server/supabase/database.types";

import {
  footballDataConfig,
  type NormalizedMatchRow,
  type NormalizedTeamMatchStat,
  type NormalizedTeamRow,
} from "./types";

export type FootballDataCacheInput = {
  teams: NormalizedTeamRow[];
  matches: NormalizedMatchRow[];
  teamStats: NormalizedTeamMatchStat[];
};

type TeamLookup = Map<string, string>;
type MatchLookup = Map<string, string>;

export async function cacheFootballData(
  supabase: SupabaseClient,
  input: FootballDataCacheInput,
) {
  if (input.teams.length > 0) {
    const { error } = await supabase.from("teams").upsert(input.teams, {
      onConflict: "external_id",
    });

    if (error) {
      throw error;
    }
  }

  const teamIdsByExternalId = await loadTeamLookup(supabase);
  const matchInserts = buildMatchInserts(input.matches, teamIdsByExternalId);

  if (matchInserts.length > 0) {
    const { error } = await supabase.from("matches").upsert(matchInserts, {
      onConflict: "external_id",
    });

    if (error) {
      throw error;
    }
  }

  const matchIdsByExternalId = await loadMatchLookup(supabase);
  const statInserts = buildTeamMatchStatInserts(
    input.teamStats,
    teamIdsByExternalId,
    matchIdsByExternalId,
  );

  if (statInserts.length > 0) {
    const { error } = await supabase
      .from("team_match_stats")
      .upsert(statInserts, {
        onConflict: "match_id,team_id",
      });

    if (error) {
      throw error;
    }
  }

  return {
    teamCount: input.teams.length,
    matchCount: matchInserts.length,
    statCount: statInserts.length,
  };
}

export function buildMatchInserts(
  matches: NormalizedMatchRow[],
  teamIdsByExternalId: TeamLookup,
) {
  return matches.map((match) => ({
    external_id: match.external_id,
    tournament_code: match.tournament_code,
    stage: match.stage,
    status: match.status,
    home_team_id:
      match.home_team_external_id == null
        ? null
        : teamIdsByExternalId.get(match.home_team_external_id) ?? null,
    away_team_id:
      match.away_team_external_id == null
        ? null
        : teamIdsByExternalId.get(match.away_team_external_id) ?? null,
    home_score: match.home_score,
    away_score: match.away_score,
    kickoff_at: match.kickoff_at,
    data_freshness: match.data_freshness,
    raw_payload: match.raw_payload,
  }));
}

export function buildTeamMatchStatInserts(
  stats: NormalizedTeamMatchStat[],
  teamIdsByExternalId: TeamLookup,
  matchIdsByExternalId: MatchLookup,
) {
  return stats.flatMap((stat) => {
    const matchId = matchIdsByExternalId.get(stat.match_external_id);
    const teamId = teamIdsByExternalId.get(stat.team_external_id);

    if (!matchId || !teamId) {
      return [];
    }

    return [
      {
        match_id: matchId,
        team_id: teamId,
        goals_for: stat.goals_for,
        goals_against: stat.goals_against,
        cards: stat.cards,
        raw_payload: stat.raw_payload,
      },
    ];
  });
}

export async function createSyncRun(
  supabase: SupabaseClient,
  metadata: Json,
) {
  const { data, error } = await supabase
    .from("football_data_sync_runs")
    .insert({
      endpoint: "competitions/WC/teams+matches",
      status: "started",
      metadata,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function finishSyncRun(
  supabase: SupabaseClient,
  input: {
    runId: string;
    status: "succeeded" | "failed";
    recordsChanged: number;
    errorMessage?: string | null;
    metadata?: Json;
  },
) {
  const { error } = await supabase
    .from("football_data_sync_runs")
    .update({
      status: input.status,
      finished_at: new Date().toISOString(),
      records_changed: input.recordsChanged,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    })
    .eq("id", input.runId);

  if (error) {
    throw error;
  }
}

export async function updateSyncState(
  supabase: SupabaseClient,
  input: {
    runId: string;
    lastSuccessfulSyncAt: string;
    metadata: Json;
  },
) {
  const { error } = await supabase.from("football_data_sync_state").upsert(
    {
      key: footballDataConfig.tournamentCode,
      last_successful_sync_at: input.lastSuccessfulSyncAt,
      last_run_id: input.runId,
      metadata: input.metadata,
      updated_at: input.lastSuccessfulSyncAt,
    },
    {
      onConflict: "key",
    },
  );

  if (error) {
    throw error;
  }
}

async function loadTeamLookup(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, external_id")
    .eq("tournament_code", footballDataConfig.tournamentCode);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? [])
      .filter((row) => row.external_id != null)
      .map((row) => [row.external_id as string, row.id]),
  );
}

async function loadMatchLookup(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, external_id")
    .eq("tournament_code", footballDataConfig.tournamentCode);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? [])
      .filter((row) => row.external_id != null)
      .map((row) => [row.external_id as string, row.id]),
  );
}
