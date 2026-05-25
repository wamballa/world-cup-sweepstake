import { describe, expect, it } from "vitest";

import {
  mapMatchStatus,
  normalizeFootballDataPayload,
} from "./normalize";
import type { FootballDataSyncPayload } from "./types";

const payload: FootballDataSyncPayload = {
  teams: {
    teams: [
      {
        id: 101,
        name: "Aurora Republic",
        shortName: "Aurora",
        tla: "AUR",
        area: { flag: "https://crests.football-data.org/101.svg" },
      },
      { id: 102, name: "Bayside Union", shortName: "Bayside", tla: "BAY" },
    ],
  },
  matches: {
    matches: [
      {
        id: 5001,
        utcDate: "2026-06-15T20:00:00Z",
        status: "FINISHED",
        stage: "GROUP_STAGE",
        homeTeam: { id: 101, name: "Aurora Republic", tla: "AUR" },
        awayTeam: { id: 102, name: "Bayside Union", tla: "BAY" },
        score: {
          winner: "HOME_TEAM",
          fullTime: { home: 2, away: 1 },
        },
      },
      {
        id: 5002,
        utcDate: "2026-06-18T20:00:00Z",
        status: "TIMED",
        stage: "GROUP_STAGE",
        homeTeam: { id: 101, name: "Aurora Republic", tla: "AUR" },
        awayTeam: { id: null, name: null },
        score: {
          winner: null,
          fullTime: { home: null, away: null },
        },
      },
    ],
  },
};

describe("football-data normalization", () => {
  it("maps football-data statuses into app cache states", () => {
    expect(mapMatchStatus("TIMED")).toBe("scheduled");
    expect(mapMatchStatus("IN_PLAY")).toBe("live");
    expect(mapMatchStatus("FINISHED")).toBe("final");
    expect(mapMatchStatus("POSTPONED")).toBe("postponed");
    expect(mapMatchStatus("SUSPENDED")).toBe("cancelled");
    expect(mapMatchStatus("UNKNOWN")).toBe("delayed");
  });

  it("normalizes teams, matches, and final-match team stats", () => {
    const normalized = normalizeFootballDataPayload(payload);

    expect(normalized.teamRows).toEqual([
      {
        external_id: "101",
        tournament_code: "WC_2026",
        name: "Aurora Republic",
        short_name: "AUR",
        group_name: null,
        flag_source_url: "https://crests.football-data.org/101.svg",
      },
      {
        external_id: "102",
        tournament_code: "WC_2026",
        name: "Bayside Union",
        short_name: "BAY",
        group_name: null,
        flag_source_url: null,
      },
    ]);
    expect(normalized.matchRows[0]).toMatchObject({
      external_id: "5001",
      status: "final",
      home_team_external_id: "101",
      away_team_external_id: "102",
      home_score: 2,
      away_score: 1,
      data_freshness: "final",
    });
    expect(normalized.matchRows[1]).toMatchObject({
      status: "scheduled",
      away_team_external_id: null,
      data_freshness: "scheduled",
    });
    expect(normalized.teamStats).toEqual([
      expect.objectContaining({
        match_external_id: "5001",
        team_external_id: "101",
        goals_for: 2,
        goals_against: 1,
      }),
      expect.objectContaining({
        match_external_id: "5001",
        team_external_id: "102",
        goals_for: 1,
        goals_against: 2,
      }),
    ]);
  });

  it("normalizes rows under a selected validation tournament code", () => {
    const normalized = normalizeFootballDataPayload(payload, "PL_2024");

    expect(normalized.teamRows).toEqual([
      expect.objectContaining({ external_id: "101", tournament_code: "PL_2024" }),
      expect.objectContaining({ external_id: "102", tournament_code: "PL_2024" }),
    ]);
    expect(normalized.matchRows).toEqual([
      expect.objectContaining({ external_id: "5001", tournament_code: "PL_2024" }),
      expect.objectContaining({ external_id: "5002", tournament_code: "PL_2024" }),
    ]);
  });
});
