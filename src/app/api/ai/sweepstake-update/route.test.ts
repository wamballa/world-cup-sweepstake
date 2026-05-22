import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/ai/sweepstake-update", () => ({
  getOrCreateSweepstakeUpdate: vi.fn(async () => ({
    status: "ready",
    text: "AI update",
    cached: false,
    generatedAt: "2026-06-15T09:00:00.000Z",
    freshnessLabel: "Preview data",
    model: "test-model",
  })),
}));

vi.mock("@/server/shared-board/load-shared-board", () => ({
  loadSharedBoardByShareToken: vi.fn(async (shareToken: string) =>
    shareToken === "missing" ? null : { sweepstakeId: "real" },
  ),
}));

vi.mock("@/server/shared-board/preview-shared-board", () => ({
  createPreviewSharedBoardData: vi.fn(() => ({ sweepstakeId: "preview" })),
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/ai/sweepstake-update", {
    method: "POST",
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("AI sweepstake update route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a share token", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
    });
  });

  it("rejects unknown shared links", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest({ shareToken: "missing" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      message: "Sweepstake not found.",
    });
  });

  it("returns the generated update for a valid shared link", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest({ shareToken: "shared-token" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ready",
      text: "AI update",
    });
  });
});
