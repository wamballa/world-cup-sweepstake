import { notFound } from "next/navigation";

import { ParticipantBoard } from "@/features/sweepstake-demo/participant-board";
import { loadSharedBoardByShareToken } from "@/server/shared-board/load-shared-board";
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

  return <ParticipantBoard shareToken={shareToken} boardData={boardData} />;
}
