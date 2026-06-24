import { beforeEach, describe, expect, it, vi } from "vitest";

const scores: Array<{
  id: string;
  sweepstake_id: string;
  player_name: string;
  score: number;
  created_at: string;
}> = [];

vi.mock("@/server/shared-board/load-shared-board", () => ({
  loadSharedBoardByShareToken: vi.fn(async (shareToken: string) => {
    if (shareToken === "missing") {
      return null;
    }

    if (shareToken === "official") {
      return {
        sweepstakeId: "sweepstake-1",
        boardVariant: "official",
      };
    }

    return {
      sweepstakeId: "sweepstake-1",
      boardVariant: "alternative",
    };
  }),
}));

vi.mock("@/server/supabase/client", () => ({
  getSupabaseServiceRoleClient: vi.fn(() => ({
    from(table: string) {
      expect(table).toBe("keepy_uppy_scores");

      return {
        insert(row: {
          sweepstake_id: string;
          player_name: string;
          score: number;
        }) {
          scores.push({
            id: `score-${scores.length + 1}`,
            sweepstake_id: row.sweepstake_id,
            player_name: row.player_name,
            score: row.score,
            created_at: `2026-06-22T10:${String(scores.length).padStart(2, "0")}:00.000Z`,
          });

          return { error: null };
        },
        select() {
          return createScoreQuery();
        },
      };
    },
  })),
}));

describe("keepy-uppy scores", () => {
  beforeEach(() => {
    scores.length = 0;
    vi.clearAllMocks();
  });

  it("returns top scores ordered by score, creation time, then id", async () => {
    scores.push(
      scoreRow("b", "Bea", 9, "2026-06-22T10:02:00.000Z"),
      scoreRow("a", "Ava", 9, "2026-06-22T10:01:00.000Z"),
      scoreRow("c", "Cal", 7, "2026-06-22T10:00:00.000Z"),
    );

    const { getKeepyUppyScoreboardByShareToken } = await import("./scores");

    await expect(
      getKeepyUppyScoreboardByShareToken("shared-token"),
    ).resolves.toMatchObject({
      highScore: 9,
      scores: [
        { id: "a", playerName: "Ava", score: 9 },
        { id: "b", playerName: "Bea", score: 9 },
        { id: "c", playerName: "Cal", score: 7 },
      ],
    });
  });

  it("normalizes names and returns the refreshed top 10 after insert", async () => {
    const { submitKeepyUppyScore } = await import("./scores");

    await expect(
      submitKeepyUppyScore({
        shareToken: "shared-token",
        playerName: "  Ada   Lovelace  ",
        score: 12,
      }),
    ).resolves.toMatchObject({
      highScore: 12,
      scores: [{ playerName: "Ada Lovelace", score: 12 }],
    });
    expect(scores[0]?.player_name).toBe("Ada Lovelace");
  });

  it("saves a valid score when fewer than 10 scores exist", async () => {
    scores.push(
      scoreRow("leader", "Leader", 20),
      scoreRow("runner-up", "Runner Up", 10),
    );

    const { submitKeepyUppyScore } = await import("./scores");

    const result = await submitKeepyUppyScore({
      shareToken: "shared-token",
      playerName: "Tenth Hopeful",
      score: 3,
    });

    expect(result.scores).toHaveLength(3);
    expect(scores).toHaveLength(3);
    expect(scores.map((row) => row.player_name)).toContain("Tenth Hopeful");
  });

  it("saves only scores that strictly beat 10th place once the table is full", async () => {
    scores.push(
      scoreRow("score-1", "One", 20),
      scoreRow("score-2", "Two", 19),
      scoreRow("score-3", "Three", 18),
      scoreRow("score-4", "Four", 17),
      scoreRow("score-5", "Five", 16),
      scoreRow("score-6", "Six", 15),
      scoreRow("score-7", "Seven", 14),
      scoreRow("score-8", "Eight", 13),
      scoreRow("score-9", "Nine", 12),
      scoreRow("score-10", "Ten", 10),
    );

    const { submitKeepyUppyScore } = await import("./scores");

    const beatingResult = await submitKeepyUppyScore({
      shareToken: "shared-token",
      playerName: "Beats Tenth",
      score: 11,
    });
    const equalResult = await submitKeepyUppyScore({
      shareToken: "shared-token",
      playerName: "Equal Tenth",
      score: 10,
    });
    const lowerResult = await submitKeepyUppyScore({
      shareToken: "shared-token",
      playerName: "Below Tenth",
      score: 9,
    });

    expect(beatingResult.scores).toHaveLength(10);
    expect(beatingResult.scores.map((score) => score.playerName)).toContain(
      "Beats Tenth",
    );
    expect(equalResult.scores.map((score) => score.playerName)).not.toContain(
      "Equal Tenth",
    );
    expect(lowerResult.scores.map((score) => score.playerName)).not.toContain(
      "Below Tenth",
    );
    expect(scores.map((row) => row.player_name)).toContain("Beats Tenth");
    expect(scores.map((row) => row.player_name)).not.toContain("Equal Tenth");
    expect(scores.map((row) => row.player_name)).not.toContain("Below Tenth");
  });

  it("rejects invalid names, score ranges, missing links, and official boards", async () => {
    const {
      getKeepyUppyScoreboardByShareToken,
      submitKeepyUppyScore,
    } = await import("./scores");

    await expect(
      submitKeepyUppyScore({
        shareToken: "shared-token",
        playerName: "",
        score: 1,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      submitKeepyUppyScore({
        shareToken: "shared-token",
        playerName: "Ava",
        score: 1000,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      getKeepyUppyScoreboardByShareToken(""),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      getKeepyUppyScoreboardByShareToken("missing"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      getKeepyUppyScoreboardByShareToken("official"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns empty data for the hardcoded preview token", async () => {
    const { getKeepyUppyScoreboardByShareToken, previewShareToken } =
      await import("./scores");

    await expect(
      getKeepyUppyScoreboardByShareToken(previewShareToken),
    ).resolves.toEqual({
      highScore: 0,
      scores: [],
    });
  });
});

function scoreRow(
  id: string,
  playerName: string,
  score: number,
  createdAt = "2026-06-22T10:00:00.000Z",
) {
  return {
    id,
    sweepstake_id: "sweepstake-1",
    player_name: playerName,
    score,
    created_at: createdAt,
  };
}

function createScoreQuery() {
  return {
    eq() {
      return this;
    },
    order() {
      return this;
    },
    limit(limit: number) {
      return {
        data: [...scores]
          .sort(
            (a, b) =>
              b.score - a.score ||
              a.created_at.localeCompare(b.created_at) ||
              a.id.localeCompare(b.id),
          )
          .slice(0, limit),
        error: null,
      };
    },
  };
}
