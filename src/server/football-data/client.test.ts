import { describe, expect, it } from "vitest";

import { createFootballDataClient, FootballDataApiError } from "./client";
import type { FootballDataFetch } from "./types";

describe("football-data server client", () => {
  it("calls football-data.org endpoints server-side with the auth token", async () => {
    const requested: Array<{ url: string; token: string | null }> = [];
    const fetchMock: FootballDataFetch = async (input, init) => {
      requested.push({
        url: String(input),
        token: new Headers(init?.headers).get("X-Auth-Token"),
      });

      return Response.json({ teams: [], matches: [] });
    };
    const client = createFootballDataClient({
      apiToken: "test-token",
      fetch: fetchMock,
      baseUrl: "https://example.test",
    });

    await client.getTeams();
    await client.getMatches();

    expect(requested).toEqual([
      {
        url: "https://example.test/v4/competitions/WC/teams?season=2026",
        token: "test-token",
      },
      {
        url: "https://example.test/v4/competitions/WC/matches?season=2026",
        token: "test-token",
      },
    ]);
  });

  it("uses the selected validation dataset for API requests", async () => {
    const requested: string[] = [];
    const client = createFootballDataClient({
      apiToken: "test-token",
      fetch: async (input) => {
        requested.push(String(input));

        return Response.json({ teams: [], matches: [] });
      },
      baseUrl: "https://example.test",
      tournamentCode: "PL_2024",
    });

    await client.getTeams();
    await client.getMatches();

    expect(requested).toEqual([
      "https://example.test/v4/competitions/PL/teams?season=2024",
      "https://example.test/v4/competitions/PL/matches?season=2024",
    ]);
  });

  it("throws a typed error on failed API responses", async () => {
    const client = createFootballDataClient({
      apiToken: "test-token",
      baseUrl: "https://example.test",
      fetch: async () =>
        new Response("rate limited", {
          status: 429,
        }),
    });

    await expect(client.getMatches()).rejects.toBeInstanceOf(
      FootballDataApiError,
    );
  });

});
