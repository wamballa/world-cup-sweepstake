import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { runFootballDataSync } from "@/server/football-data/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret =
    process.env.CRON_SECRET ?? process.env.FOOTBALL_DATA_SYNC_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Sync secret is not configured." },
      { status: 500 },
    );
  }

  if (!isValidBearerToken(authHeader, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runFootballDataSync();
  const status = result.status === "failed" ? 502 : 200;

  return NextResponse.json(result, { status });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

function isValidBearerToken(authHeader: string | null, expectedSecret: string) {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const providedSecret = authHeader.slice("Bearer ".length);
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
