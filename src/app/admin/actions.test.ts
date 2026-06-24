import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const requireSweepstakeAdmin = vi.fn();
vi.mock("@/server/supabase/admin-auth", () => ({
  requireSweepstakeAdmin: (...args: unknown[]) => requireSweepstakeAdmin(...args),
}));

const update = vi.fn();
const eq = vi.fn(async () => ({ error: null }));
const from = vi.fn(() => ({
  update: (...args: unknown[]) => {
    update(...args);

    return { eq };
  },
}));
const serviceEq = vi.fn(async () => ({ error: null }));
const serviceDelete = vi.fn(() => ({ eq: serviceEq }));
const serviceFrom = vi.fn(() => ({
  delete: serviceDelete,
}));
const authGetUser = vi.fn(async () => ({
  data: { user: { id: "admin-1" } },
  error: null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: authGetUser },
    from,
  }),
}));

vi.mock("@/server/supabase/client", () => ({
  getSupabaseServiceRoleClient: () => ({
    from: serviceFrom,
  }),
}));

vi.mock("@/server/football-data/recalculate", () => ({
  recalculateSweepstakeScores: vi.fn(),
}));

vi.mock("@/server/football-data/sync", () => ({
  runFootballDataSync: vi.fn(),
}));

vi.mock("@/server/ai/sweepstake-update", () => ({
  getOrCreateSweepstakeUpdate: vi.fn(),
}));

vi.mock("@/server/shared-board/load-shared-board", () => ({
  loadSharedBoardById: vi.fn(),
}));

import {
  clearSweepstakeKeepyUppyScores,
  saveSweepstakeBoardVariant,
} from "./actions";

describe("admin board variant action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eq.mockResolvedValue({ error: null });
    serviceEq.mockResolvedValue({ error: null });
    authGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
  });

  it("requires sweepstake admin authorization and saves the board variant", async () => {
    await saveSweepstakeBoardVariant({
      sweepstakeId: "sweepstake-1",
      boardVariant: "alternative",
      shareToken: "share-token-1",
    });

    expect(requireSweepstakeAdmin).toHaveBeenCalledWith(
      expect.anything(),
      "admin-1",
      "sweepstake-1",
    );
    expect(from).toHaveBeenCalledWith("sweepstakes");
    expect(update).toHaveBeenCalledWith({ board_variant: "alternative" });
    expect(eq).toHaveBeenCalledWith("id", "sweepstake-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/s/[shareToken]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/s/share-token-1");
  });

  it("rejects invalid board variants before updating", async () => {
    await expect(
      saveSweepstakeBoardVariant({
        sweepstakeId: "sweepstake-1",
        boardVariant: "banana" as "official",
      }),
    ).rejects.toThrow("Choose a valid main board UI.");

    expect(update).not.toHaveBeenCalled();
  });

  it("requires sweepstake admin authorization and clears keepy-uppy scores only", async () => {
    await clearSweepstakeKeepyUppyScores({
      sweepstakeId: "sweepstake-1",
      shareToken: "share-token-1",
    });

    expect(requireSweepstakeAdmin).toHaveBeenCalledWith(
      expect.anything(),
      "admin-1",
      "sweepstake-1",
    );
    expect(serviceFrom).toHaveBeenCalledWith("keepy_uppy_scores");
    expect(serviceDelete).toHaveBeenCalled();
    expect(serviceEq).toHaveBeenCalledWith("sweepstake_id", "sweepstake-1");
    expect(update).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/s/[shareToken]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/s/share-token-1");
  });
});
