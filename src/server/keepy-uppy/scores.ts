import "server-only";

import { loadSharedBoardByShareToken } from "@/server/shared-board/load-shared-board";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";

export const previewShareToken = "preview-v7m4q2x9c8p6n3r5t1w0y4k7";
export const keepyUppyPlayerNameMaxLength = 40;
export const keepyUppyScoreMax = 999;

export type KeepyUppyScore = {
  id: string;
  playerName: string;
  score: number;
  createdAt: string;
};

export type KeepyUppyScoreboard = {
  highScore: number;
  scores: KeepyUppyScore[];
};

type KeepyUppyScoreRow = {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
};

type KeepyUppyScoreInsert = {
  sweepstake_id: string;
  player_name: string;
  score: number;
};

type KeepyUppyScoresSelectQuery = {
  eq(column: "sweepstake_id", value: string): KeepyUppyScoresSelectQuery;
  order(
    column: "score" | "created_at" | "id",
    options: { ascending: boolean },
  ): KeepyUppyScoresSelectQuery;
  limit(limit: number): PromiseLike<{
    data: KeepyUppyScoreRow[] | null;
    error: Error | null;
  }>;
};

type KeepyUppyScoresTable = {
  insert(row: KeepyUppyScoreInsert): PromiseLike<{ error: Error | null }>;
  select(columns: string): KeepyUppyScoresSelectQuery;
};

type KeepyUppyScoresClient = {
  from(table: "keepy_uppy_scores"): KeepyUppyScoresTable;
};

export class KeepyUppyScoreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const emptyScoreboard: KeepyUppyScoreboard = {
  highScore: 0,
  scores: [],
};

export async function getKeepyUppyScoreboardByShareToken(shareToken: string) {
  const sweepstakeId = await resolveAlternativeSweepstakeId(shareToken);

  if (!sweepstakeId) {
    return emptyScoreboard;
  }

  return getKeepyUppyScoreboard(sweepstakeId);
}

export async function getKeepyUppyScoreboardForSweepstake(
  sweepstakeId: string,
) {
  return getKeepyUppyScoreboard(sweepstakeId);
}

export async function submitKeepyUppyScore({
  playerName,
  score,
  shareToken,
}: {
  shareToken: string;
  playerName: string;
  score: number;
}) {
  const normalizedPlayerName = normalizeKeepyUppyPlayerName(playerName);
  const normalizedScore = validateKeepyUppyScore(score);
  const sweepstakeId = await resolveAlternativeSweepstakeId(shareToken);

  if (!sweepstakeId) {
    return emptyScoreboard;
  }

  const scoreboard = await getKeepyUppyScoreboard(sweepstakeId);

  if (!qualifiesForKeepyUppyTopTen(normalizedScore, scoreboard.scores)) {
    return scoreboard;
  }

  const supabase = getKeepyUppyScoresClient();
  const { error } = await supabase.from("keepy_uppy_scores").insert({
    sweepstake_id: sweepstakeId,
    player_name: normalizedPlayerName,
    score: normalizedScore,
  });

  if (error) {
    throw error;
  }

  return getKeepyUppyScoreboard(sweepstakeId);
}

export function qualifiesForKeepyUppyTopTen(
  score: number,
  scores: KeepyUppyScore[],
) {
  if (!Number.isInteger(score) || score < 1 || score > keepyUppyScoreMax) {
    return false;
  }

  if (scores.length < 10) {
    return true;
  }

  return score > scores[9].score;
}

export function normalizeKeepyUppyPlayerName(playerName: unknown) {
  if (typeof playerName !== "string") {
    throw new KeepyUppyScoreError("Player name is required.", 400);
  }

  const normalized = playerName.trim().replace(/\s+/g, " ");

  if (
    normalized.length < 1 ||
    normalized.length > keepyUppyPlayerNameMaxLength
  ) {
    throw new KeepyUppyScoreError(
      `Player name must be 1-${keepyUppyPlayerNameMaxLength} characters.`,
      400,
    );
  }

  return normalized;
}

export function validateKeepyUppyScore(score: unknown) {
  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > keepyUppyScoreMax
  ) {
    throw new KeepyUppyScoreError(
      `Score must be a whole number from 1-${keepyUppyScoreMax}.`,
      400,
    );
  }

  return score;
}

async function resolveAlternativeSweepstakeId(shareToken: string) {
  const trimmedShareToken = validateShareToken(shareToken);

  if (trimmedShareToken === previewShareToken) {
    return null;
  }

  const boardData = await loadSharedBoardByShareToken(trimmedShareToken);

  if (!boardData) {
    throw new KeepyUppyScoreError("Sweepstake not found.", 404);
  }

  if (boardData.boardVariant !== "alternative") {
    throw new KeepyUppyScoreError(
      "Keepy-uppy scores are available only on the Alternative Board.",
      404,
    );
  }

  return boardData.sweepstakeId;
}

function validateShareToken(shareToken: unknown) {
  if (typeof shareToken !== "string" || !shareToken.trim()) {
    throw new KeepyUppyScoreError("A shared sweepstake link is required.", 400);
  }

  return shareToken.trim();
}

async function getKeepyUppyScoreboard(sweepstakeId: string) {
  const supabase = getKeepyUppyScoresClient();
  const { data, error } = await supabase
    .from("keepy_uppy_scores")
    .select("id, player_name, score, created_at")
    .eq("sweepstake_id", sweepstakeId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(10);

  if (error) {
    throw error;
  }

  const scores =
    data?.map((row) => ({
      id: row.id,
      playerName: row.player_name,
      score: row.score,
      createdAt: row.created_at,
    })) ?? [];

  return {
    highScore: scores[0]?.score ?? 0,
    scores,
  };
}

function getKeepyUppyScoresClient() {
  return getSupabaseServiceRoleClient() as unknown as KeepyUppyScoresClient;
}
