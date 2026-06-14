import { describe, expect, it, vi } from "vitest";

import { createPreviewSharedBoardData } from "@/server/shared-board/preview-shared-board";

import {
  buildSweepstakeUpdatePromptPayload,
  buildSweepstakeUpdateCachePayload,
  createOpenAiResponse,
  createSweepstakeUpdateInstructions,
  defaultSweepstakeUpdateModel,
  getOrCreateSweepstakeUpdate,
  hashSweepstakeUpdatePayload,
  sweepstakeUpdatePromptVersion,
  validateSweepstakeUpdate,
} from "./sweepstake-update";

function createBoardData() {
  return {
    ...createPreviewSharedBoardData(),
    sweepstakeId: "sweepstake-1",
    syncState: {
      lastSuccessfulSyncAt: "2026-06-15T08:00:00.000Z",
      freshnessLabel: "Checked 15 Jun 2026, 09:00",
      freshnessStatus: "current" as const,
      freshnessNotice: "Scores may be delayed by the data provider.",
    },
  };
}

function createSupabaseStub(cachedOutput?: {
  output_text: string;
  created_at: string;
  model: string;
}) {
  type StubGeneration = {
    id: string;
    output_text: string;
    created_at: string;
    updated_at: string;
    model: string;
    generation_status: "generating" | "ready";
  };

  let currentOutput: StubGeneration | null = cachedOutput
    ? {
        id: "generation-1",
        ...cachedOutput,
        updated_at: cachedOutput.created_at,
        generation_status: "ready",
      }
    : null;
  const writes: unknown[] = [];
  const filters: Array<[string, string]> = [];

  return {
    writes,
    filters,
    get currentOutput() {
      return currentOutput;
    },
    client: {
      rpc: async (
        _functionName: string,
        args: { force_rewrite: boolean; target_model: string },
      ) => {
        if (currentOutput?.generation_status === "ready" && !args.force_rewrite) {
          return {
            data: [
              {
                generation_id: currentOutput.id,
                claimed: false,
                previous_output_text: currentOutput.output_text,
                created_at: currentOutput.created_at,
                updated_at: currentOutput.updated_at,
                model: currentOutput.model,
              },
            ],
            error: null,
          };
        }

        if (currentOutput?.generation_status === "generating") {
          return {
            data: [
              {
                generation_id: currentOutput.id,
                claimed: false,
                previous_output_text: currentOutput.output_text,
                created_at: currentOutput.created_at,
                updated_at: currentOutput.updated_at,
                model: currentOutput.model,
              },
            ],
            error: null,
          };
        }

        const previousOutputText = currentOutput?.output_text ?? "";
        const claimedOutput: StubGeneration = {
          id: currentOutput?.id ?? "generation-1",
          output_text: previousOutputText,
          created_at:
            currentOutput?.created_at ?? "2026-06-15T09:00:00.000Z",
          updated_at: "2026-06-15T09:00:00.000Z",
          model: args.target_model,
          generation_status: "generating",
        };
        currentOutput = claimedOutput;

        return {
          data: [
            {
              generation_id: claimedOutput.id,
              claimed: true,
              previous_output_text: previousOutputText,
              created_at: claimedOutput.created_at,
              updated_at: claimedOutput.updated_at,
              model: claimedOutput.model,
            },
          ],
          error: null,
        };
      },
      from: () => ({
        select: () => {
          const builder = {
            eq: (column: string, value: string) => {
              filters.push([column, value]);
              return builder;
            },
            neq: (column: string, value: string) => {
              filters.push([`neq:${column}`, value]);
              return builder;
            },
            order: () => builder,
            limit: () => builder,
            maybeSingle: async () => ({
              data: currentOutput,
              error: null,
            }),
          };

          return builder;
        },
        update: (value: Record<string, unknown>) => ({
          eq: async () => {
            writes.push(value);
            currentOutput = currentOutput
              ? {
                  ...currentOutput,
                  ...value,
                  generation_status:
                    value.generation_status === "generating"
                      ? "generating"
                      : "ready",
                }
              : null;
            return { error: null };
          },
        }),
        delete: () => ({
          eq: async () => {
            currentOutput = null;
            return { error: null };
          },
        }),
      }),
    },
  };
}

describe("sweepstake AI update prompt payload", () => {
  it("uses cached board data without participant emails or secrets", () => {
    const payload = buildSweepstakeUpdatePromptPayload(createBoardData());
    const serializedPayload = JSON.stringify(payload);

    expect(payload.freshness).toBe("Checked 15 Jun 2026, 09:00");
    expect(payload.standings[0]).toMatchObject({
      rank: 1,
    });
    expect(payload.standings[0].name).toEqual(expect.any(String));
    expect(payload.promptVersion).toBe(sweepstakeUpdatePromptVersion);
    expect(payload.recentCompletedMatches.length).toBeGreaterThan(0);
    expect(payload).not.toHaveProperty("recentFinalMatches");
    expect(payload.upcomingOrDelayedMatches.length).toBeGreaterThan(0);
    expect(serializedPayload).not.toContain("emailUpdatesEnabled");
    expect(serializedPayload).not.toContain("OPENAI");
    expect(serializedPayload).not.toContain("SUPABASE");
  });

  it("ignores sync and live-state churn but changes for completed results", () => {
    const boardData = createBoardData();
    const firstHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdateCachePayload(boardData),
    );
    const secondHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdateCachePayload({
        ...boardData,
        syncState: {
          ...boardData.syncState,
          lastSuccessfulSyncAt: "2026-06-15T08:05:00.000Z",
          freshnessLabel: "Checked 15 Jun 2026, 09:05",
        },
        matches: boardData.matches.map((match) =>
          match.status === "live"
            ? { ...match, homeScore: (match.homeScore ?? 0) + 1 }
            : match,
        ),
      }),
    );
    const completedMatch = boardData.matches.find(
      (match) => match.status !== "final",
    );
    const changedHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdateCachePayload({
        ...boardData,
        matches: boardData.matches.map((match) =>
          match.id === completedMatch?.id
            ? { ...match, status: "final" as const, homeScore: 2, awayScore: 1 }
            : match,
        ),
      }),
    );

    expect(firstHash).toBe(secondHash);
    expect(changedHash).not.toBe(firstHash);
  });

  it("changes cache identity when allocations change", () => {
    const boardData = createBoardData();
    const firstHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdateCachePayload(boardData),
    );
    const changedHash = hashSweepstakeUpdatePayload(
      buildSweepstakeUpdateCachePayload({
        ...boardData,
        standings: boardData.standings.map((standing, index) =>
          index === 0
            ? { ...standing, teamIds: [...standing.teamIds, "moved-team"] }
            : standing,
        ),
      }),
    );

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
      standings: boardData.standings.map((standing) => ({
        ...standing,
        points: 0,
        rank: 1,
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
    const instructions = createSweepstakeUpdateInstructions(
      "in_progress_or_complete",
    );

    expect(instructions).toContain("one short headline of 8 words or fewer");
    expect(instructions).toContain("3 to 4 bullets");
    expect(instructions).toContain("18 words or fewer");
    expect(instructions).toContain("Do not add a separate cache note");
    expect(instructions).toContain("Do not describe leaderboard movement");
    expect(instructions).toContain("Never say the tournament has not started");
    expect(instructions).toContain("witty colleague");
    expect(instructions).toContain("at most one humorous observation");
    expect(instructions).toContain("never mock or repeatedly target");
    expect(instructions).toContain("all to play for");
    expect(instructions).toContain("Use only the JSON payload supplied by the app");
    expect(instructions).toContain("Never call them finals");
    expect(instructions).toContain("use Final only");
  });

  it("does not expose pre-tournament wording to an in-progress prompt", () => {
    const instructions = createSweepstakeUpdateInstructions(
      "in_progress_or_complete",
    );

    expect(instructions).not.toContain(
      "You may say the tournament has not started",
    );
    expect(instructions).toContain(
      "Never say the tournament has not started",
    );
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
        generation_status: "ready",
        model: "test-model",
        output_text: "Fresh AI sweepstake update",
      }),
    ]);
  });

  it("shares one generation across concurrent participant requests", async () => {
    const supabase = createSupabaseStub();
    let resolveGeneration: ((value: string) => void) | undefined;
    const openAiClient = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveGeneration = resolve;
        }),
    );
    const options = {
      apiKey: "test-key",
      model: "test-model",
      openAiClient,
      supabase: supabase.client as never,
    };

    const firstRequest = getOrCreateSweepstakeUpdate(
      createBoardData(),
      options,
    );
    await vi.waitFor(() => expect(openAiClient).toHaveBeenCalledTimes(1));
    const secondRequest = getOrCreateSweepstakeUpdate(
      createBoardData(),
      options,
    );

    resolveGeneration?.("One shared narrative");

    await expect(firstRequest).resolves.toMatchObject({
      status: "ready",
      text: "One shared narrative",
      cached: false,
    });
    await expect(secondRequest).resolves.toMatchObject({
      status: "ready",
      text: "One shared narrative",
      cached: true,
    });
    expect(openAiClient).toHaveBeenCalledTimes(1);
  });

  it("forces one rewrite for the current facts", async () => {
    const supabase = createSupabaseStub({
      output_text: "Old narrative",
      created_at: "2026-06-15T09:00:00.000Z",
      model: "test-model",
    });
    const openAiClient = vi.fn(async () => "Rewritten narrative");

    const result = await getOrCreateSweepstakeUpdate(createBoardData(), {
      apiKey: "test-key",
      forceRewrite: true,
      rewrittenBy: "admin-1",
      model: "test-model",
      openAiClient,
      supabase: supabase.client as never,
    });

    expect(result).toMatchObject({
      status: "ready",
      text: "Rewritten narrative",
      cached: false,
    });
    expect(openAiClient).toHaveBeenCalledTimes(1);
    expect(supabase.currentOutput?.output_text).toBe("Rewritten narrative");
    expect(supabase.writes.at(-1)).toMatchObject({
      generation_reason: "admin_rewrite",
      rewritten_by: "admin-1",
    });
  });

  it("returns the previous narrative when a forced rewrite fails", async () => {
    const supabase = createSupabaseStub({
      output_text: "Keep this narrative",
      created_at: "2026-06-15T09:00:00.000Z",
      model: "test-model",
    });

    await expect(
      getOrCreateSweepstakeUpdate(createBoardData(), {
        apiKey: "test-key",
        forceRewrite: true,
        model: "test-model",
        openAiClient: vi.fn(async () => {
          throw new Error("OpenAI unavailable");
        }),
        supabase: supabase.client as never,
      }),
    ).resolves.toMatchObject({
      status: "ready",
      text: "Keep this narrative",
      cached: true,
    });

    expect(supabase.currentOutput).toMatchObject({
      output_text: "Keep this narrative",
      generation_status: "ready",
    });
  });

  it("retries one invalid narrative then saves the corrected output", async () => {
    const supabase = createSupabaseStub();
    const openAiClient = vi
      .fn()
      .mockResolvedValueOnce(
        "Wrong state\n\n- Tournament hasn’t started; everyone is on zero.",
      )
      .mockResolvedValueOnce(
        "Current table takes shape\n\n- The cached completed results have put points on the board.",
      );

    const result = await getOrCreateSweepstakeUpdate(createBoardData(), {
      apiKey: "test-key",
      model: "test-model",
      openAiClient,
      supabase: supabase.client as never,
    });

    expect(result).toMatchObject({
      status: "ready",
      text: expect.stringContaining("Current table takes shape"),
      cached: false,
    });
    expect(openAiClient).toHaveBeenCalledTimes(2);
    expect(openAiClient.mock.calls[1][0].instructions).toContain(
      "previous draft was rejected",
    );
  });

  it("returns the previous valid narrative when both rewrite attempts fail validation", async () => {
    const supabase = createSupabaseStub({
      output_text: "Keep this valid narrative",
      created_at: "2026-06-15T09:00:00.000Z",
      model: "test-model",
    });
    const openAiClient = vi.fn(async () =>
      Promise.resolve(
        "Wrong state\n\n- Tournament hasn’t started; everyone is on zero.",
      ),
    );

    const result = await getOrCreateSweepstakeUpdate(createBoardData(), {
      apiKey: "test-key",
      forceRewrite: true,
      model: "test-model",
      openAiClient,
      supabase: supabase.client as never,
    });

    expect(result).toMatchObject({
      status: "ready",
      text: "Keep this valid narrative",
      cached: true,
    });
    expect(openAiClient).toHaveBeenCalledTimes(2);
    expect(supabase.currentOutput).toMatchObject({
      output_text: "Keep this valid narrative",
      generation_status: "ready",
    });
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

describe("sweepstake AI update validation", () => {
  it("rejects the exact eight-match pre-tournament contradiction", () => {
    const boardData = createBoardData();
    const completedMatches = boardData.matches.slice(0, 8).map((match, index) => ({
      ...match,
      status: "final" as const,
      homeScore: index === 6 ? 4 : index === 7 ? 2 : 1,
      awayScore: index === 6 ? 1 : index === 7 ? 0 : 1,
    }));
    const standings = boardData.standings.map((standing, index) => ({
      ...standing,
      rank: index === 0 ? 1 : index < 5 ? 2 : 6,
      points: index === 0 ? 4 : index < 5 ? 3 : 1,
    }));
    const payload = buildSweepstakeUpdatePromptPayload({
      ...boardData,
      matches: [
        ...completedMatches,
        ...boardData.matches.slice(8).map((match) => ({
          ...match,
          status: "scheduled" as const,
        })),
      ],
      standings,
      summary: {
        ...boardData.summary,
        finalMatchCount: 8,
        hasFinalMatches: true,
        totalGoals: 20,
      },
    });
    const result = validateSweepstakeUpdate(
      [
        "Early points on the board",
        "",
        "- Tournament hasn’t started from the cached results; everyone’s on zero overall.",
        "- Recent completed results are in.",
        `- ${standings[0].name} leads on 4 points.`,
      ].join("\n"),
      payload,
    );

    expect(payload.competitionState).toBe("in_progress_or_complete");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "pre-tournament wording contradicts completed matches or participant points",
    );
  });

  it("accepts valid pre-tournament wording only for zero-result data", () => {
    const boardData = createBoardData();
    const payload = buildSweepstakeUpdatePromptPayload({
      ...boardData,
      matches: boardData.matches.map((match) => ({
        ...match,
        status: "scheduled" as const,
        homeScore: null,
        awayScore: null,
      })),
      standings: boardData.standings.map((standing) => ({
        ...standing,
        points: 0,
        rank: 1,
      })),
      summary: {
        ...boardData.summary,
        finalMatchCount: 0,
        hasFinalMatches: false,
        totalGoals: 0,
      },
    });

    expect(
      validateSweepstakeUpdate(
        "Kick-off still pending\n\n- Tournament hasn’t started from cached results; everyone is on zero.",
        payload,
      ),
    ).toMatchObject({ valid: true });
  });

  it("rejects unsupported scores, fixtures, points, ranks, and team names", () => {
    const payload = buildSweepstakeUpdatePromptPayload(createBoardData());
    const participant = payload.standings[0];
    const result = validateSweepstakeUpdate(
      [
        "Facts took the afternoon off",
        "",
        `- ${participant.name} leads on ${participant.points + 7} points.`,
        "- Atlantis beat Germany 9-0.",
        "- Next up: Atlantis v Germany.",
      ].join("\n"),
      payload,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unsupported match score"),
        expect.stringContaining("unsupported team name"),
        expect.stringContaining("unsupported points claim"),
      ]),
    );
  });

  it("accepts supported multi-fixture and shared-rank wording", () => {
    const boardData = createBoardData();
    const firstFour = boardData.standings.slice(0, 4);
    const standings = boardData.standings.map((standing, index) => ({
      ...standing,
      rank: index < 4 ? 2 : 6,
      points: index < 4 ? 3 : 1,
    }));
    const payload = buildSweepstakeUpdatePromptPayload({
      ...boardData,
      standings,
    });
    const upcoming = payload.upcomingOrDelayedMatches.slice(0, 2);
    const result = validateSweepstakeUpdate(
      [
        "A tidy little queue forms",
        "",
        "- Four participants share second place on 3 points.",
        `- Next up: ${upcoming[0].homeTeamName} v ${upcoming[0].awayTeamName}, ${upcoming[1].homeTeamName} v ${upcoming[1].awayTeamName}.`,
        `- ${firstFour[0].name} is among the group on 3 points.`,
      ].join("\n"),
      payload,
    );

    expect(result).toMatchObject({ valid: true, errors: [] });
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
