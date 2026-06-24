import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/keepy-uppy/scores", () => {
  class KeepyUppyScoreError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  }

  return {
    KeepyUppyScoreError,
    getKeepyUppyScoreboardByShareToken: vi.fn(async (shareToken: string) => {
      if (shareToken === "missing") {
        throw new KeepyUppyScoreError("Sweepstake not found.", 404);
      }

      return {
        highScore: 7,
        scores: [
          {
            id: "score-1",
            playerName: "Ava",
            score: 7,
            createdAt: "2026-06-22T10:00:00.000Z",
          },
        ],
      };
    }),
    submitKeepyUppyScore: vi.fn(
      async ({
        playerName,
        score,
      }: {
        shareToken: string;
        playerName: string;
        score: number;
      }) => {
        if (!playerName) {
          throw new KeepyUppyScoreError("Player name is required.", 400);
        }

        return {
          highScore: score,
          scores: [
            {
              id: "score-2",
              playerName,
              score,
              createdAt: "2026-06-22T10:01:00.000Z",
            },
          ],
        };
      },
    ),
  };
});

describe("keepy-uppy score route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns scores for a valid shared link", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/keepy-uppy-scores?shareToken=abc"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      highScore: 7,
      scores: [{ playerName: "Ava", score: 7 }],
    });
  });

  it("returns helper errors with their status", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest(
        "http://localhost/api/keepy-uppy-scores?shareToken=missing",
      ),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Sweepstake not found.",
    });
  });

  it("submits a score and returns the refreshed table", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/keepy-uppy-scores", {
        method: "POST",
        body: JSON.stringify({
          shareToken: "abc",
          playerName: "Maya",
          score: 14,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      highScore: 14,
      scores: [{ playerName: "Maya", score: 14 }],
    });
  });

  it("rejects malformed JSON and validation failures", async () => {
    const { POST } = await import("./route");
    const malformed = await POST(
      new NextRequest("http://localhost/api/keepy-uppy-scores", {
        method: "POST",
        body: "{",
      }),
    );
    const invalid = await POST(
      new NextRequest("http://localhost/api/keepy-uppy-scores", {
        method: "POST",
        body: JSON.stringify({
          shareToken: "abc",
          score: 14,
        }),
      }),
    );

    expect(malformed.status).toBe(400);
    expect(invalid.status).toBe(400);
  });
});
