import { notFound } from "next/navigation";

import { CountdownPage } from "@/features/sweepstake-demo/countdown-page";
import { AlternativeBoard } from "@/features/sweepstake-demo/alternative-board";
import { ParticipantBoard } from "@/features/sweepstake-demo/participant-board";
import { loadSharedBoardByShareToken } from "@/server/shared-board/load-shared-board";
import { loadLatestLeaderboardSnapshotMovement } from "@/server/shared-board/leaderboard-snapshot-movement";
import { createPreviewSharedBoardData } from "@/server/shared-board/preview-shared-board";

const previewShareToken = "preview-v7m4q2x9c8p6n3r5t1w0y4k7";

export default async function SharedSweepstakePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  if (shareToken === previewShareToken) {
    return (
      <ParticipantBoard
        shareToken={shareToken}
        boardData={createPreviewSharedBoardData()}
      />
    );
  }

  const boardData = await loadSharedBoardByShareToken(shareToken);

  if (!boardData) {
    notFound();
  }

  if (boardData.sharedViewMode === "countdown") {
    return <CountdownPage boardData={boardData} />;
  }

  if (boardData.boardVariant === "alternative") {
    const movement = await loadLatestLeaderboardSnapshotMovement(
      boardData.sweepstakeId,
    );

    return (
      <AlternativeBoard
        boardData={boardData}
        officialMovementByParticipantId={movement.officialMovementByParticipantId}
      />
    );
  }

  return <ParticipantBoard shareToken={shareToken} boardData={boardData} />;
}
