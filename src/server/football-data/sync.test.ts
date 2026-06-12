import { describe, expect, it } from "vitest";

import {
  buildMatchTransitions,
  fetchFootballDataPayload,
  getCaughtErrorMessage,
  selectFootballDataSyncMode,
  shouldSkipFootballDataSync,
} from "./sync";

describe("football-data sync rate guard", () => {
  it("skips sync runs that start less than one minute after the previous run", () => {
    expect(
      shouldSkipFootballDataSync(
        "2026-05-20T13:00:30.000Z",
        new Date("2026-05-20T13:01:00.000Z"),
      ),
    ).toBe(true);
  });

  it("allows sync runs once the one minute football-data.org cooldown has passed", () => {
    expect(
      shouldSkipFootballDataSync(
        "2026-05-20T13:00:00.000Z",
        new Date("2026-05-20T13:01:00.000Z"),
      ),
    ).toBe(false);
  });

  it("preserves plain Supabase error object messages", () => {
    expect(
      getCaughtErrorMessage({
        code: "42P10",
        message: "there is no unique or exclusion constraint matching",
      }),
    ).toBe("there is no unique or exclusion constraint matching");
  });
});

describe("football-data sync mode", () => {
  it("uses match-only mode until the full refresh is 30 minutes old", () => {
    expect(
      selectFootballDataSyncMode({
        forceFullSync: false,
        lastFullSyncAt: "2026-06-12T20:00:00.000Z",
        now: new Date("2026-06-12T20:29:59.000Z"),
      }),
    ).toBe("matches");

    expect(
      selectFootballDataSyncMode({
        forceFullSync: false,
        lastFullSyncAt: "2026-06-12T20:00:00.000Z",
        now: new Date("2026-06-12T20:30:00.000Z"),
      }),
    ).toBe("full");
  });

  it("forces full mode for manual syncs or missing history", () => {
    expect(
      selectFootballDataSyncMode({
        forceFullSync: true,
        lastFullSyncAt: "2026-06-12T20:29:00.000Z",
        now: new Date("2026-06-12T20:30:00.000Z"),
      }),
    ).toBe("full");
    expect(
      selectFootballDataSyncMode({
        forceFullSync: false,
        lastFullSyncAt: null,
        now: new Date("2026-06-12T20:30:00.000Z"),
      }),
    ).toBe("full");
  });

  it("makes one provider request for match-only and two for full syncs", async () => {
    const calls: string[] = [];
    const client = {
      getTeams: async () => {
        calls.push("teams");
        return { teams: [] };
      },
      getMatches: async () => {
        calls.push("matches");
        return { matches: [] };
      },
    };

    await fetchFootballDataPayload(client, "matches");
    expect(calls).toEqual(["matches"]);

    calls.length = 0;
    await fetchFootballDataPayload(client, "full");
    expect(calls.sort()).toEqual(["matches", "teams"]);
  });

  it("records status and score transitions without unchanged matches", () => {
    expect(
      buildMatchTransitions(
        [
          {
            external_id: "537333",
            status: "live",
            home_score: 1,
            away_score: 1,
          },
          {
            external_id: "unchanged",
            status: "scheduled",
            home_score: null,
            away_score: null,
          },
        ],
        [
          {
            external_id: "537333",
            tournament_code: "WC_2026",
            stage: "GROUP_STAGE",
            status: "final",
            home_team_external_id: "1",
            away_team_external_id: "2",
            home_score: 1,
            away_score: 1,
            kickoff_at: "2026-06-12T19:00:00Z",
            data_freshness: "final",
            raw_payload: {},
          },
          {
            external_id: "unchanged",
            tournament_code: "WC_2026",
            stage: "GROUP_STAGE",
            status: "scheduled",
            home_team_external_id: "3",
            away_team_external_id: "4",
            home_score: null,
            away_score: null,
            kickoff_at: "2026-06-13T19:00:00Z",
            data_freshness: "scheduled",
            raw_payload: {},
          },
        ],
      ),
    ).toEqual([
      {
        matchId: "537333",
        previousStatus: "live",
        nextStatus: "final",
        previousScore: [1, 1],
        nextScore: [1, 1],
      },
    ]);
  });
});
