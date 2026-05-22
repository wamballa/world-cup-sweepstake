import { NextResponse, type NextRequest } from "next/server";

import { getOrCreateSweepstakeUpdate } from "@/server/ai/sweepstake-update";
import { loadSharedBoardByShareToken } from "@/server/shared-board/load-shared-board";
import { createPreviewSharedBoardData } from "@/server/shared-board/preview-shared-board";

const previewShareToken = "preview-v7m4q2x9c8p6n3r5t1w0y4k7";

export async function POST(request: NextRequest) {
  let body: { shareToken?: unknown };

  try {
    body = (await request.json()) as { shareToken?: unknown };
  } catch {
    return NextResponse.json(
      { status: "unavailable", message: "Invalid AI update request." },
      { status: 400 },
    );
  }

  if (typeof body.shareToken !== "string" || !body.shareToken.trim()) {
    return NextResponse.json(
      { status: "unavailable", message: "A shared sweepstake link is required." },
      { status: 400 },
    );
  }

  try {
    const boardData =
      body.shareToken === previewShareToken
        ? createPreviewSharedBoardData()
        : await loadSharedBoardByShareToken(body.shareToken);

    if (!boardData) {
      return NextResponse.json(
        { status: "unavailable", message: "Sweepstake not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(await getOrCreateSweepstakeUpdate(boardData));
  } catch (error) {
    console.error("AI sweepstake update failed", error);

    return NextResponse.json({
      status: "unavailable",
      message:
        "AI update is unavailable right now. The scoreboard data above is still the source of truth.",
    });
  }
}
