import {
  footballDataConfig,
  type FootballDataMatch,
  type FootballDataSyncPayload,
  type NormalizedMatchRow,
  type NormalizedTeamMatchStat,
  type NormalizedTeamRow,
} from "./types";

export function normalizeFootballDataPayload(
  payload: FootballDataSyncPayload,
  tournamentCode: string = footballDataConfig.tournamentCode,
) {
  const teamRows = payload.teams.teams.map((team) =>
    normalizeTeam(team, tournamentCode),
  );
  const matchRows = payload.matches.matches.map((match) =>
    normalizeMatch(match, tournamentCode),
  );
  const teamStats = payload.matches.matches.flatMap(normalizeTeamMatchStats);

  return {
    teamRows,
    matchRows,
    teamStats,
    recordsChanged: teamRows.length + matchRows.length + teamStats.length,
  };
}

export function normalizeTeam(team: {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  group?: string | null;
  area?: {
    flag?: string | null;
  } | null;
}, tournamentCode: string = footballDataConfig.tournamentCode): NormalizedTeamRow {
  return {
    external_id: String(team.id),
    tournament_code: tournamentCode,
    name: team.name,
    short_name: team.tla ?? team.shortName ?? null,
    group_name: team.group ?? null,
    flag_source_url: normalizeFlagUrl(team.area?.flag),
  };
}

export function normalizeMatch(
  match: FootballDataMatch,
  tournamentCode: string = footballDataConfig.tournamentCode,
): NormalizedMatchRow {
  const status = mapMatchStatus(match.status);
  const score = getDisplayScore(match);

  return {
    external_id: String(match.id),
    tournament_code: tournamentCode,
    stage: match.stage,
    status,
    home_team_external_id:
      match.homeTeam.id == null ? null : String(match.homeTeam.id),
    away_team_external_id:
      match.awayTeam.id == null ? null : String(match.awayTeam.id),
    home_score: score.home,
    away_score: score.away,
    kickoff_at: match.utcDate || null,
    data_freshness: mapDataFreshness(match.status),
    raw_payload: match,
  };
}

export function normalizeTeamMatchStats(
  match: FootballDataMatch,
): NormalizedTeamMatchStat[] {
  if (mapMatchStatus(match.status) !== "final") {
    return [];
  }

  const score = getDisplayScore(match);

  if (
    match.homeTeam.id == null ||
    match.awayTeam.id == null ||
    score.home == null ||
    score.away == null
  ) {
    return [];
  }

  return [
    {
      match_external_id: String(match.id),
      team_external_id: String(match.homeTeam.id),
      goals_for: score.home,
      goals_against: score.away,
      cards: null,
      raw_payload: match,
    },
    {
      match_external_id: String(match.id),
      team_external_id: String(match.awayTeam.id),
      goals_for: score.away,
      goals_against: score.home,
      cards: null,
      raw_payload: match,
    },
  ];
}

export function mapMatchStatus(
  status: string,
): NormalizedMatchRow["status"] {
  switch (status) {
    case "TIMED":
    case "SCHEDULED":
      return "scheduled";
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
      return "final";
    case "POSTPONED":
      return "postponed";
    case "CANCELLED":
    case "SUSPENDED":
      return "cancelled";
    default:
      return "delayed";
  }
}

export function mapDataFreshness(
  status: string,
): NormalizedMatchRow["data_freshness"] {
  switch (status) {
    case "FINISHED":
      return "final";
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "TIMED":
    case "SCHEDULED":
      return "scheduled";
    default:
      return "delayed";
  }
}

function getDisplayScore(match: FootballDataMatch) {
  return match.score.fullTime.home == null && match.score.regularTime
    ? match.score.regularTime
    : match.score.fullTime;
}

function normalizeFlagUrl(flagUrl: string | null | undefined) {
  if (!flagUrl) {
    return null;
  }

  try {
    const url = new URL(flagUrl);

    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
