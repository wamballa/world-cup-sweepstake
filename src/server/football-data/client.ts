import "server-only";

import {
  footballDataConfig,
  type FootballDataFetch,
  type FootballDataMatchesResponse,
  type FootballDataTeamsResponse,
} from "./types";
import { getFootballDataTournamentByCode } from "@/features/tournaments/world-cup";

export class FootballDataApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = "FootballDataApiError";
  }
}

export type FootballDataClient = {
  getTeams: () => Promise<FootballDataTeamsResponse>;
  getMatches: () => Promise<FootballDataMatchesResponse>;
};

export function createFootballDataClient(options?: {
  apiToken?: string;
  fetch?: FootballDataFetch;
  baseUrl?: string;
  tournamentCode?: string;
}): FootballDataClient {
  const apiToken = options?.apiToken ?? process.env.FOOTBALL_DATA_API_TOKEN;
  const fetchImpl = options?.fetch ?? fetch;
  const baseUrl = options?.baseUrl ?? footballDataConfig.baseUrl;
  const tournament = getFootballDataTournamentByCode(
    options?.tournamentCode ?? footballDataConfig.tournamentCode,
  );

  if (!apiToken) {
    throw new Error("Missing required environment variable: FOOTBALL_DATA_API_TOKEN");
  }
  const token = apiToken;

  async function request<T>(endpoint: string): Promise<T> {
    const response = await fetchImpl(new URL(endpoint, baseUrl), {
      headers: {
        "X-Auth-Token": token,
      },
      next: {
        revalidate: 0,
      },
    });

    if (!response.ok) {
      throw new FootballDataApiError(
        `football-data.org request failed with ${response.status}`,
        response.status,
        endpoint,
      );
    }

    return response.json() as Promise<T>;
  }

  return {
    getTeams: () =>
      request<FootballDataTeamsResponse>(
        `/v4/competitions/${tournament.competitionCode}/teams?season=${tournament.season}`,
      ),
    getMatches: () =>
      request<FootballDataMatchesResponse>(
        `/v4/competitions/${tournament.competitionCode}/matches?season=${tournament.season}`,
      ),
  };
}
