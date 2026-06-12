import { describe, expect, it, vi } from "vitest";

import { createPreviewSharedBoardData } from "@/server/shared-board/preview-shared-board";

import {
  buildSweepstakeUpdatePromptPayload,
  createOpenAiResponse,
  createSweepstakeUpdateInstructions,
  defaultSweepstakeUpdateModel,
  getOrCreateSweepstakeUpdate,
  hashSweepstakeUpdatePayload,
  sweepstakeUpdateFeatureKey,
} from "./sweepstake-update";

function createBoardData() {
  return {
    ...createPreviewSharedBoardData(),
    sweepstakeId: "sweepstake-1",
    syncState: {
      lastSuccessfulSyncAt: "2026-06-15T08:00:00.000Z",
      freshnessLabel: "Updated 15 Jun 2026, 09:00",
    },
  };
}

function createSupabaseStub(cachedOutput?: {
  output_text: string;
  created_at: string;
  model: string;
}) {
  const writes: unknown[] = [];
  const filters: Array<[string, string]> = [];

  return {
    writes,
    filters,
    client: {
      from: () => ({
        select: () => {
          const builder = {
            eq: (column: string, value: string) => {
              filters.push([column, value]);
              return builder;
            },
            maybeSingle: async () => ({
              data: cachedOutput ?? null,
              error: null,
            }),
          };

          return builder;
        },
        insert: async (value: unknown) => {
          writes.push(value);
          return { error: null };
        },
      }),
    },
  };
}

describe("sweepstake AI update prompt payload", () => {
  it("uses cached board data without participant emails or secrets", () => {
    const payload = buildSweepstakeUpdatePromptPayload(createBoardData());
    const serializedPayload = JSON.stringify(payload);

    expect(payload.freshness).toBe("Updated 15 Jun 2026, 09:00");
    expect(payload.standings[0]).toMatchObject({
      rank: 1,
    });
    expect(payload.standings[0].name).toEqual(expect.any(String));
    expect(payload.promptVersion).toBe(
      "2026-06-12-completed-match-language-v5",
    );
    expect(payload.recentCompletedMatches.length).toBeGreaterThan(0);
    expect(payload).not.toHaveProperty("recentFinalMatches");
    expect(payload.upcomingOrDelayedMatches.length).toBeGreaterThan(0);
    expect(serializedPayload).not.toContain("emailUpdatesEnabled");
    expect(serializedPayload).not.toContain("OPENAI");
    expect(serializedPayload).not.toContain("SUPABASE");
  });

  it("hashes stable payloads consistently and changes when data changes", () => {
    const boardData = createBoardData();
    const firstHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdatePromptPayload(boardData),
    );
    const secondHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdatePromptPayload(boardData),
    );
    const changedHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdatePromptPayload({
        ...boardData,
        standings: [
          {
            ...boardData.standings[0],
            points: boardData.standings[0].points + 3,
          },
          ...boardData.standings.slice(1),
        ],
      }),
    );

    expect(firstHash).toBe(secondHash);
    expect(changedHash).not.toBe(firstHash);
  });

  it("marks no-result tournament data as pre-tournament for safer commentary", () => {
    const boardData = createBoardData();
    const payload = buildSweepstakeUpdatePromptPayload({
      ...boardData,
      matches: boardData.matches.map((match) => ({
        ...match,
        status: "scheduled",
        homeScore: null,
        awayScore: null,
      })),
      teams: boardData.teams.map((team) => ({
        ...team,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      })),
      summary: {
        ...boardData.summary,
        finalMatchCount: 0,
        totalGoals: 0,
        hasFinalMatches: false,
      },
    });

    expect(payload.competitionState).toBe("pre_tournament");
    expect(payload.recentCompletedMatches).toHaveLength(0);
    expect(payload.badges.every((badge) => badge.holders.length === 0)).toBe(
      true,
    );
  });
});

describe("sweepstake AI update instructions", () => {
  it("requires compact grounded commentary without duplicate cache notes", () => {
    const instructions = createSweepstakeUpdateInstructions();

    expect(instructions).toContain("one short headline of 8 words or fewer");
    expect(instructions).toContain("3 to 4 bullets");
    expect(instructions).toContain("18 words or fewer");
    expect(instructions).toContain("Do not add a separate cache note");
    expect(instructions).toContain("Do not describe leaderboard movement");
    expect(instructions).toContain("competitionState is pre_tournament");
    expect(instructions).toContain("never pile on one participant");
    expect(instructions).toContain("Use only the JSON payload supplied by the app");
    expect(instructions).toContain("Never call them finals");
    expect(instructions).toContain("use Final only");
  });
});

describe("getOrCreateSweepstakeUpdate", () => {
  it("returns cached generations without calling OpenAI", async () => {
    const cachedOutput = {
      output_text: "Cached sweepstake update",
      created_at: "2026-06-15T09:00:00.000Z",
      model: defaultSweepstakeUpdateModel,
    };
    const supabase = createSupabaseStub(cachedOutput);
    const openAiClient = vi.fn();

    const result = await getOrCreateSweepstakeUpdate(createBoardData(), {
      openAiClient,
      supabase: supabase.client as never,
    });

    expect(result).toMatchObject({
      status: "ready",
      text: "Cached sweepstake update",
      cached: true,
    });
    expect(openAiClient).not.toHaveBeenCalled();
    expect(supabase.writes).toHaveLength(0);
  });

  it("creates and caches a generation when no cached row exists", async () => {
    const supabase = createSupabaseStub();
    const openAiClient = vi.fn(async () => "Fresh AI sweepstake update");

    const result = await getOrCreateSweepstakeUpdate(createBoardData(), {
      apiKey: "test-key",
      model: "test-model",
      openAiClient,
      supabase: supabase.client as never,
    });

    expect(result).toMatchObject({
      status: "ready",
      text: "Fresh AI sweepstake update",
      cached: false,
      model: "test-model",
    });
    expect(openAiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "test-key",
        instructions: expect.stringContaining("3 to 4 bullets"),
        model: "test-model",
      }),
    );
    expect(supabase.writes).toEqual([
      expect.objectContaining({
        feature_key: sweepstakeUpdateFeatureKey,
        model: "test-model",
        output_text: "Fresh AI sweepstake update",
        sweepstake_id: "sweepstake-1",
      }),
    ]);
  });

  it("gracefully reports unavailable when the API key is missing", async () => {
    const supabase = createSupabaseStub();
    const result = await getOrCreateSweepstakeUpdate(createBoardData(), {
      apiKey: "",
      openAiClient: vi.fn(),
      supabase: supabase.client as never,
    });

    expect(result.status).toBe("unavailable");
    expect(supabase.writes).toHaveLength(0);
  });
});

describe("createOpenAiResponse", () => {
  it("normalizes Responses API output_text", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output_text: "Hello from cached data" }),
    } as Response);

    await expect(
      createOpenAiResponse({
        apiKey: "test-key",
        model: "test-model",
        instructions: "Use app data only.",
        input: "{}",
      }),
    ).resolves.toBe("Hello from cached data");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
      }),
    );
    fetchSpy.mockRestore();
  });
});
