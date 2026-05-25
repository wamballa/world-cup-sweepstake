import "server-only";

import { createHash } from "node:crypto";

import type { SharedBoardData } from "@/features/shared-board/shared-board-data";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";

export const sweepstakeUpdateFeatureKey = "sweepstake_update_v1";
export const defaultSweepstakeUpdateModel = "gpt-5.4-mini";

type AiGenerationRow = {
  output_text: string;
  created_at: string;
  model: string;
};

type AiCacheSelectBuilder = {
  eq: (
    column: "sweepstake_id" | "feature_key" | "input_hash",
    value: string,
  ) => AiCacheSelectBuilder;
  maybeSingle: () => Promise<{
    data: AiGenerationRow | null;
    error: Error | null;
  }>;
};

type SupabaseAiCacheClient = {
  from: (table: "ai_generations") => {
    select: (columns: string) => AiCacheSelectBuilder;
    insert: (
      value: {
        sweepstake_id: string;
        feature_key: string;
        input_hash: string;
        source_updated_at: string | null;
        model: string;
        output_text: string;
      },
    ) => Promise<{ error: Error | null }>;
  };
};

export type SweepstakeUpdateResult =
  | {
      status: "ready";
      text: string;
      cached: boolean;
      generatedAt: string;
      freshnessLabel: string;
      model: string;
    }
  | {
      status: "unavailable";
      message: string;
      freshnessLabel: string;
    };

export type OpenAiResponsesClient = (
  input: OpenAiResponsesRequest,
) => Promise<string>;

export type OpenAiResponsesRequest = {
  apiKey: string;
  model: string;
  instructions: string;
  input: string;
};

export async function getOrCreateSweepstakeUpdate(
  boardData: SharedBoardData,
  options: {
    apiKey?: string;
    model?: string;
    openAiClient?: OpenAiResponsesClient;
    supabase?: SupabaseAiCacheClient;
  } = {},
): Promise<SweepstakeUpdateResult> {
  const promptPayload = buildSweepstakeUpdatePromptPayload(boardData);
  const inputHash = hashSweepstakeUpdatePayload(promptPayload);
  const freshnessLabel = boardData.syncState.freshnessLabel;
  const supabase =
    options.supabase ??
    (getSupabaseServiceRoleClient() as unknown as SupabaseAiCacheClient);

  if (boardData.sweepstakeId !== "preview") {
    const cached = await readCachedSweepstakeUpdate({
      supabase,
      sweepstakeId: boardData.sweepstakeId,
      inputHash,
    });

    if (cached) {
      return {
        status: "ready",
        text: cached.output_text,
        cached: true,
        generatedAt: cached.created_at,
        freshnessLabel,
        model: cached.model,
      };
    }
  }

  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      status: "unavailable",
      message:
        "AI update is unavailable right now. The scoreboard data above is still the source of truth.",
      freshnessLabel,
    };
  }

  const model =
    options.model ??
    process.env.OPENAI_SWEEPSTAKE_MODEL ??
    defaultSweepstakeUpdateModel;
  const outputText = await (options.openAiClient ?? createOpenAiResponse)({
    apiKey,
    model,
    instructions: createSweepstakeUpdateInstructions(),
    input: JSON.stringify(promptPayload),
  });
  const generatedAt = new Date().toISOString();

  if (boardData.sweepstakeId !== "preview") {
    await writeCachedSweepstakeUpdate({
      supabase,
      sweepstakeId: boardData.sweepstakeId,
      inputHash,
      sourceUpdatedAt: promptPayload.sourceUpdatedAt,
      model,
      outputText,
    });
  }

  return {
    status: "ready",
    text: outputText,
    cached: false,
    generatedAt,
    freshnessLabel,
    model,
  };
}

export function buildSweepstakeUpdatePromptPayload(boardData: SharedBoardData) {
  const competitionState = getSweepstakeUpdateCompetitionState(boardData);
  const hasResultBackedBadges = competitionState !== "pre_tournament";
  const recentFinalMatches = boardData.matches
    .filter((match) => match.status === "final")
    .slice(-5)
    .map((match) => ({
      stage: match.stage,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      homeParticipantName: match.homeParticipantName,
      awayParticipantName: match.awayParticipantName,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      freshness: match.freshness,
    }));
  const upcomingOrDelayedMatches = boardData.matches
    .filter((match) => match.status !== "final")
    .slice(0, 5)
    .map((match) => ({
      stage: match.stage,
      status: match.status,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      participantLabel: match.participantLabel,
      kickoffLabel: match.kickoffLabel,
      freshness: match.freshness,
    }));

  return {
    feature: sweepstakeUpdateFeatureKey,
    promptVersion: "2026-05-24-pre-tournament-v4",
    sweepstake: {
      id: boardData.sweepstakeId,
      name: boardData.sweepstakeName,
      tournamentCode: boardData.tournamentCode,
    },
    sourceUpdatedAt: boardData.syncState.lastSuccessfulSyncAt,
    freshness: boardData.syncState.freshnessLabel,
    competitionState,
    summary: boardData.summary,
    standings: boardData.standings.slice(0, 10).map((standing) => ({
      rank: standing.rank,
      name: standing.name,
      points: standing.points,
      teamCount: standing.teamCount,
      teamNames: standing.teamNames,
    })),
    teams: boardData.teams.map((team) => ({
      name: team.name,
      shortName: team.shortName,
      allocatedToName: team.allocatedToName,
      status: team.status,
      points: team.points,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
    })),
    badges: boardData.badges.map((badge) => ({
      label: badge.label,
      status: badge.status,
      holders: hasResultBackedBadges
        ? badge.holderParticipantIds
            .map(
              (participantId) =>
                boardData.participants.find(
                  (participant) => participant.id === participantId,
                )?.name,
            )
            .filter(Boolean)
        : [],
      supportLine: badge.supportLine,
    })),
    recentFinalMatches,
    upcomingOrDelayedMatches,
    scoringRules:
      "Group win 3, group draw 1, reach Round of 16 5, reach Quarter-final 8, reach Semi-final 12, runner-up 15, World Cup winner 25.",
  };
}

function getSweepstakeUpdateCompetitionState(boardData: SharedBoardData) {
  if (
    !boardData.summary.hasFinalMatches &&
    boardData.summary.finalMatchCount === 0 &&
    boardData.summary.totalGoals === 0
  ) {
    return "pre_tournament";
  }

  return "in_progress_or_complete";
}

export function hashSweepstakeUpdatePayload(
  payload: ReturnType<typeof buildSweepstakeUpdatePromptPayload>,
) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function createSweepstakeUpdateInstructions() {
  return [
    "You write a compact AI sweepstake update for a friendly World Cup 2026 office or group sweepstake.",
    "Use only the JSON payload supplied by the app. Do not use outside football knowledge.",
    "Do not invent scores, fixtures, lineups, injuries, form, statistics, badge holders, or standings.",
    "Do not describe leaderboard movement or say someone is still leading unless the payload includes prior standings; prefer current-position wording.",
    "When competitionState is pre_tournament, do not name badge holders, top spot holders, podium chasers, winners, losers, or leaderboard drama.",
    "When competitionState is pre_tournament, say the tournament has not started from the cached results, everyone is on zero, and mention upcoming fixtures if supplied.",
    "Do not make gambling-style advice or predictions. Avoid certainty about future outcomes.",
    "If cached data is missing, delayed, awaiting first sync, or not final, say that plainly and briefly.",
    "Refer to freshness only as the football-data cache timestamp from the payload, not the current time or generation time.",
    "Keep the tone punchy, warm, and lightly playful. Banter must stay kind, office-safe, and never pile on one participant.",
    "Prioritize what matters now: leader gap, podium chase, badge race, recent final results, or team points. Skip low-signal facts.",
    "Return plain text only in this exact shape: one short headline of 8 words or fewer, then 3 to 4 bullets. Each bullet must be 18 words or fewer.",
    "Do not add a separate cache note, sign-off, intro, or markdown heading. The app displays freshness beside the update.",
  ].join(" ");
}

export async function createOpenAiResponse({
  apiKey,
  input,
  instructions,
  model,
}: OpenAiResponsesRequest) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      max_output_tokens: 260,
      store: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI response failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };
  const outputText =
    data.output_text ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text))
      .join("\n")
      .trim();

  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return outputText;
}

async function readCachedSweepstakeUpdate({
  inputHash,
  supabase,
  sweepstakeId,
}: {
  inputHash: string;
  supabase: SupabaseAiCacheClient;
  sweepstakeId: string;
}) {
  const { data, error } = await supabase
    .from("ai_generations")
    .select("output_text, created_at, model")
    .eq("sweepstake_id", sweepstakeId)
    .eq("feature_key", sweepstakeUpdateFeatureKey)
    .eq("input_hash", inputHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function writeCachedSweepstakeUpdate({
  inputHash,
  model,
  outputText,
  sourceUpdatedAt,
  supabase,
  sweepstakeId,
}: {
  inputHash: string;
  model: string;
  outputText: string;
  sourceUpdatedAt: string | null;
  supabase: SupabaseAiCacheClient;
  sweepstakeId: string;
}) {
  const { error } = await supabase.from("ai_generations").insert({
    sweepstake_id: sweepstakeId,
    feature_key: sweepstakeUpdateFeatureKey,
    input_hash: inputHash,
    source_updated_at: sourceUpdatedAt,
    model,
    output_text: outputText,
  });

  if (error && !isDuplicateCacheWriteError(error)) {
    throw error;
  }
}

function isDuplicateCacheWriteError(error: Error & { code?: string }) {
  return (
    error.code === "23505" ||
    error.message.toLowerCase().includes("duplicate key")
  );
}
