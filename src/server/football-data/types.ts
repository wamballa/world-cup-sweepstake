import type { Json } from "@/server/supabase/database.types";

export const footballDataConfig = {
  baseUrl: "https://api.football-data.org/v4",
  competitionCode: "WC",
  season: 2026,
  tournamentCode: "WC_2026",
} as const;

export type FootballDataFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type FootballDataTeam = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
  group?: string | null;
};

export type FootballDataScoreValue = {
  home: number | null;
  away: number | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group?: string | null;
  homeTeam: {
    id: number | null;
    name: string | null;
    shortName?: string | null;
    tla?: string | null;
  };
  awayTeam: {
    id: number | null;
    name: string | null;
    shortName?: string | null;
    tla?: string | null;
  };
  score: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration?: string;
    fullTime: FootballDataScoreValue;
    regularTime?: FootballDataScoreValue;
  };
};

export type FootballDataTeamsResponse = {
  teams: FootballDataTeam[];
};

export type FootballDataMatchesResponse = {
  matches: FootballDataMatch[];
};

export type NormalizedTeamRow = {
  external_id: string;
  tournament_code: string;
  name: string;
  short_name: string | null;
  group_name: string | null;
};

export type NormalizedMatchRow = {
  external_id: string;
  tournament_code: string;
  stage: string;
  status: "scheduled" | "delayed" | "live" | "final" | "postponed" | "cancelled";
  home_team_external_id: string | null;
  away_team_external_id: string | null;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  data_freshness: "scheduled" | "delayed" | "live" | "final" | "update_pending";
  raw_payload: Json;
};

export type NormalizedTeamMatchStat = {
  match_external_id: string;
  team_external_id: string;
  goals_for: number;
  goals_against: number;
  cards: number | null;
  raw_payload: Json;
};

export type FootballDataSyncPayload = {
  teams: FootballDataTeamsResponse;
  matches: FootballDataMatchesResponse;
};
