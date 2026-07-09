import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SharedBoardData } from "@/features/shared-board/shared-board-data";
import SharedSweepstakePage from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("@/features/sweepstake-demo/countdown-page", () => ({
  CountdownPage: ({ boardData }: { boardData: SharedBoardData }) => ({
    type: "CountdownPage",
    props: { boardData },
    key: null,
  }),
}));

vi.mock("@/features/sweepstake-demo/alternative-board", () => ({
  AlternativeBoard: ({
    boardData,
    keepyUppyScoreboard,
    alternativeMovementByParticipantId,
    shareToken,
  }: {
    boardData: SharedBoardData;
    keepyUppyScoreboard?: unknown;
    alternativeMovementByParticipantId?: Record<string, string>;
    shareToken?: string;
  }) => ({
    type: "AlternativeBoard",
    props: {
      boardData,
      keepyUppyScoreboard,
      alternativeMovementByParticipantId,
      shareToken,
    },
    key: null,
  }),
}));

vi.mock("@/features/sweepstake-demo/participant-board", () => ({
  ParticipantBoard: ({
    boardData,
    shareToken,
  }: {
    boardData: SharedBoardData;
    shareToken: string;
  }) => ({
    type: "ParticipantBoard",
    props: { boardData, shareToken },
    key: null,
  }),
}));

const loadSharedBoardByShareToken = vi.fn();
vi.mock("@/server/shared-board/load-shared-board", () => ({
  loadSharedBoardByShareToken: (shareToken: string) =>
    loadSharedBoardByShareToken(shareToken),
}));

const loadLatestLeaderboardSnapshotMovement = vi.fn(
  async (sweepstakeId: string) => ({
    sweepstakeId,
    officialMovementByParticipantId: { maya: "+1" },
    alternativeMovementByParticipantId: { maya: "-" },
  }),
);
vi.mock("@/server/shared-board/leaderboard-snapshot-movement", () => ({
  loadLatestLeaderboardSnapshotMovement: (sweepstakeId: string) =>
    loadLatestLeaderboardSnapshotMovement(sweepstakeId),
}));

const getKeepyUppyScoreboardForSweepstake = vi.fn(
  async (sweepstakeId: string) => {
    void sweepstakeId;

    return {
      highScore: 12,
      scores: [],
    };
  },
);
vi.mock("@/server/keepy-uppy/scores", () => ({
  getKeepyUppyScoreboardForSweepstake: (sweepstakeId: string) =>
    getKeepyUppyScoreboardForSweepstake(sweepstakeId),
}));

vi.mock("@/server/shared-board/preview-shared-board", () => ({
  createPreviewSharedBoardData: () => boardData({ sweepstakeId: "preview" }),
}));

const previewShareToken = "preview-v7m4q2x9c8p6n3r5t1w0y4k7";

describe("shared sweepstake route board variant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the hardcoded preview token on the official board", async () => {
    const page = await renderSharedPage(previewShareToken);

    expect(page.type.name).toBe("ParticipantBoard");
    expect(page.props.shareToken).toBe(previewShareToken);
    expect(loadSharedBoardByShareToken).not.toHaveBeenCalled();
    expect(loadLatestLeaderboardSnapshotMovement).not.toHaveBeenCalled();
  });

  it("renders the official participant board for real sweepstakes by default", async () => {
    loadSharedBoardByShareToken.mockResolvedValueOnce(boardData());

    const page = await renderSharedPage("real-token");

    expect(page.type.name).toBe("ParticipantBoard");
    expect(page.props.shareToken).toBe("real-token");
    expect(loadLatestLeaderboardSnapshotMovement).not.toHaveBeenCalled();
  });

  it("renders the Alternative Board for real sweepstakes when selected", async () => {
    loadSharedBoardByShareToken.mockResolvedValueOnce(
      boardData({ boardVariant: "alternative" }),
    );

    const page = await renderSharedPage("real-token");

    expect(page.type.name).toBe("AlternativeBoard");
    expect(page.props.shareToken).toBe("real-token");
    expect(loadLatestLeaderboardSnapshotMovement).toHaveBeenCalledWith(
      "sweepstake-1",
    );
    expect(getKeepyUppyScoreboardForSweepstake).toHaveBeenCalledWith(
      "sweepstake-1",
    );
    expect(page.props.keepyUppyScoreboard).toEqual({
      highScore: 12,
      scores: [],
    });
    expect(page.props.alternativeMovementByParticipantId).toEqual({ maya: "-" });
  });

  it("lets countdown mode override the Alternative Board variant", async () => {
    loadSharedBoardByShareToken.mockResolvedValueOnce(
      boardData({
        sharedViewMode: "countdown",
        boardVariant: "alternative",
      }),
    );

    const page = await renderSharedPage("real-token");

    expect(page.type.name).toBe("CountdownPage");
    expect(loadLatestLeaderboardSnapshotMovement).not.toHaveBeenCalled();
  });
});

async function renderSharedPage(shareToken: string) {
  return (await SharedSweepstakePage({
    params: Promise.resolve({ shareToken }),
  })) as unknown as {
    type: { name: string };
    props: Record<string, unknown>;
  };
}

function boardData(
  overrides: Partial<SharedBoardData> = {},
): SharedBoardData {
  return {
    sweepstakeId: "sweepstake-1",
    sweepstakeName: "Office Draw",
    tournamentCode: "WC_2026",
    sharedViewMode: "participant_board",
    boardVariant: "official",
    participants: [],
    standings: [],
    teams: [],
    matches: [],
    badges: [],
    syncState: {
      lastSuccessfulSyncAt: null,
      freshnessLabel: "Awaiting first sync",
      freshnessStatus: "awaiting",
      freshnessNotice: "Awaiting the first football-data.org check.",
    },
    summary: {
      leaderName: null,
      finalMatchCount: 0,
      delayedMatchCount: 0,
      scheduledMatchCount: 0,
      totalGoals: 0,
      activeTeamCount: 0,
      hasFinalMatches: false,
    },
    ...overrides,
  };
}
