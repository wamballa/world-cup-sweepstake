import { notFound } from "next/navigation";

import { AlternativeBoard } from "@/features/sweepstake-demo/alternative-board";
import { loadSharedBoardByShareToken } from "@/server/shared-board/load-shared-board";
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
  const boardData =
    shareToken === previewShareToken
      ? createPreviewSharedBoardData()
      : await loadSharedBoardByShareToken(shareToken);

  if (!boardData) {
    notFound();
  }

  return <AlternativeBoard boardData={boardData} />;
}
