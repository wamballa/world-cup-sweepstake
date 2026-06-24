import { NextResponse, type NextRequest } from "next/server";

import {
  getKeepyUppyScoreboardByShareToken,
  KeepyUppyScoreError,
  submitKeepyUppyScore,
} from "@/server/keepy-uppy/scores";

export async function GET(request: NextRequest) {
  const shareToken = request.nextUrl.searchParams.get("shareToken");

  try {
    return NextResponse.json(
      await getKeepyUppyScoreboardByShareToken(shareToken ?? ""),
    );
  } catch (error) {
    return handleKeepyUppyScoreError(error);
  }
}

export async function POST(request: NextRequest) {
  let body: {
    shareToken?: unknown;
    playerName?: unknown;
    score?: unknown;
  };

  try {
    body = (await request.json()) as {
      shareToken?: unknown;
      playerName?: unknown;
      score?: unknown;
    };
  } catch {
    return NextResponse.json(
      { message: "Invalid keepy-uppy score request." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await submitKeepyUppyScore({
        shareToken: typeof body.shareToken === "string" ? body.shareToken : "",
        playerName: typeof body.playerName === "string" ? body.playerName : "",
        score: typeof body.score === "number" ? body.score : Number.NaN,
      }),
    );
  } catch (error) {
    return handleKeepyUppyScoreError(error);
  }
}

function handleKeepyUppyScoreError(error: unknown) {
  if (error instanceof KeepyUppyScoreError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error("Keepy-uppy score request failed", error);

  return NextResponse.json(
    { message: "Keepy-uppy scores are unavailable right now." },
    { status: 500 },
  );
}
