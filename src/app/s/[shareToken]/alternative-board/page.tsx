import { notFound } from "next/navigation";

import { AlternativeBoard } from "@/features/sweepstake-demo/alternative-board";
import { getKeepyUppyScoreboardForSweepstake } from "@/server/keepy-uppy/scores";
import { loadSharedBoardByShareToken } from "@/server/shared-board/load-shared-board";
import { loadLatestLeaderboardSnapshotMovement } from "@/server/shared-board/leaderboard-snapshot-movement";
import { createPreviewSharedBoardData } from "@/server/shared-board/preview-shared-board";

const previewShareToken = "preview-v7m4q2x9c8p6n3r5t1w0y4k7";

export default async function AlternativeBoardPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  if (process.env.ALTERNATIVE_BOARD_ENABLED !== "true") {
    notFound();
  }

  const { shareToken } = await params;
  const isPreview = shareToken === previewShareToken;
  const boardData = isPreview
    ? createPreviewSharedBoardData()
    : await loadSharedBoardByShareToken(shareToken);

  if (!boardData) {
    notFound();
  }

  if (isPreview) {
    return <AlternativeBoard boardData={boardData} shareToken={shareToken} />;
  }

  const [movement, keepyUppyScoreboard] = await Promise.all([
    loadLatestLeaderboardSnapshotMovement(boardData.sweepstakeId),
    getKeepyUppyScoreboardForSweepstake(boardData.sweepstakeId),
  ]);

  return (
    <AlternativeBoard
      boardData={boardData}
      keepyUppyScoreboard={keepyUppyScoreboard}
      officialMovementByParticipantId={movement.officialMovementByParticipantId}
      shareToken={shareToken}
    />
  );
}
