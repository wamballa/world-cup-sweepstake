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
  options?: { tournamentCode?: string },
) {
  const tournamentCode =
    options?.tournamentCode ??
    input.teams[0]?.tournament_code ??
    input.matches[0]?.tournament_code ??
    footballDataConfig.tournamentCode;

  if (input.teams.length > 0) {
    const { error } = await supabase.from("teams").upsert(input.teams, {
      onConflict: "tournament_code,external_id",
    });

    if (error) {
      if (!isMissingCompositeConflictError(error)) {
        throw error;
      }

      await upsertRowsByTournamentExternalId(
        supabase,
        "teams",
        input.teams,
        tournamentCode,
      );
    }
  }

  const teamIdsByExternalId = await loadTeamLookup(supabase, tournamentCode);
  const matchInserts = buildMatchInserts(input.matches, teamIdsByExternalId);

  if (matchInserts.length > 0) {
    const { error } = await supabase.from("matches").upsert(matchInserts, {
      onConflict: "tournament_code,external_id",
    });

    if (error) {
      if (!isMissingCompositeConflictError(error)) {
        throw error;
      }

      await upsertRowsByTournamentExternalId(
        supabase,
        "matches",
        matchInserts,
        tournamentCode,
      );
    }
  }

  const matchIdsByExternalId = await loadMatchLookup(supabase, tournamentCode);
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

type TournamentExternalRow = {
  external_id: string;
  tournament_code: string;
  [key: string]: unknown;
};

export function isMissingCompositeConflictError(error: unknown) {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    error.code === "42P10"
  );
}

async function upsertRowsByTournamentExternalId(
  supabase: SupabaseClient,
  table: string,
  rows: TournamentExternalRow[],
  tournamentCode: string,
) {
  const externalIds = [...new Set(rows.map((row) => row.external_id))];
  const { data: existingRows, error: lookupError } = await supabase
    .from(table)
    .select("id, external_id")
    .eq("tournament_code", tournamentCode)
    .in("external_id", externalIds);

  if (lookupError) {
    throw lookupError;
  }

  const existingIdByExternalId = new Map(
    (existingRows ?? []).map((row) => [
      String(row.external_id),
      String(row.id),
    ]),
  );
  const inserts: TournamentExternalRow[] = [];

  for (const row of rows) {
    const existingId = existingIdByExternalId.get(row.external_id);

    if (!existingId) {
      inserts.push(row);
      continue;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(row)
      .eq("id", existingId);

    if (updateError) {
      throw updateError;
    }
  }

  if (inserts.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from(table).insert(inserts);

  if (insertError) {
    throw insertError;
  }
}

export async function createSyncRun(
  supabase: SupabaseClient,
  metadata: Json,
) {
  const metadataRecord =
    typeof metadata === "object" && metadata != null && !Array.isArray(metadata)
      ? (metadata as Record<string, Json>)
      : {};
  const tournamentCode =
    typeof metadataRecord.tournamentCode === "string"
      ? metadataRecord.tournamentCode
      : footballDataConfig.tournamentCode;
  const competitionCode =
    typeof metadataRecord.competitionCode === "string"
      ? metadataRecord.competitionCode
      : footballDataConfig.competitionCode;
  const { data, error } = await supabase
    .from("football_data_sync_runs")
    .insert({
      endpoint: `competitions/${competitionCode}/teams+matches:${tournamentCode}`,
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
    tournamentCode?: string;
    runId: string;
    lastSuccessfulSyncAt: string;
    metadata: Json;
  },
) {
  const { error } = await supabase.from("football_data_sync_state").upsert(
    {
      key: input.tournamentCode ?? footballDataConfig.tournamentCode,
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

async function loadTeamLookup(supabase: SupabaseClient, tournamentCode: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, external_id")
    .eq("tournament_code", tournamentCode);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? [])
      .filter((row) => row.external_id != null)
      .map((row) => [row.external_id as string, row.id]),
  );
}

async function loadMatchLookup(supabase: SupabaseClient, tournamentCode: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, external_id")
    .eq("tournament_code", tournamentCode);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? [])
      .filter((row) => row.external_id != null)
      .map((row) => [row.external_id as string, row.id]),
  );
}
