import "server-only";

import { createHash } from "node:crypto";

import type { SharedBoardData } from "@/features/shared-board/shared-board-data";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";

export const sweepstakeUpdateFeatureKey = "sweepstake_update_v1";
export const defaultSweepstakeUpdateModel = "gpt-5.4-mini";
export const sweepstakeUpdatePromptVersion =
  "2026-06-14-validated-match-milestones-v7";

type AiGenerationRow = {
  id?: string;
  output_text: string;
  created_at: string;
  updated_at?: string;
  model: string;
  generation_status?: "generating" | "ready" | "invalid";
};

type AiCacheSelectBuilder = {
  eq: (
    column:
      | "sweepstake_id"
      | "feature_key"
      | "input_hash"
      | "generation_status",
    value: string,
  ) => AiCacheSelectBuilder;
  neq: (column: "input_hash", value: string) => AiCacheSelectBuilder;
  order: (
    column: "updated_at",
    options: { ascending: boolean },
  ) => AiCacheSelectBuilder;
  limit: (count: number) => AiCacheSelectBuilder;
  maybeSingle: () => Promise<{
    data: AiGenerationRow | null;
    error: Error | null;
  }>;
};

type SupabaseAiCacheClient = {
  rpc: (
    functionName: "claim_ai_generation",
    args: {
      target_sweepstake_id: string;
      target_feature_key: string;
      target_input_hash: string;
      target_source_updated_at: string | null;
      target_model: string;
      target_reason: "automatic" | "admin_rewrite";
      target_rewritten_by: string | null;
      force_rewrite: boolean;
    },
  ) => Promise<{
    data:
      | Array<{
          generation_id: string;
          claimed: boolean;
          previous_output_text: string;
          created_at: string;
          updated_at: string;
          model: string;
        }>
      | null;
    error: Error | null;
  }>;
  from: (table: "ai_generations") => {
    select: (columns: string) => AiCacheSelectBuilder;
    update: (value: Record<string, unknown>) => {
      eq: (column: "id", value: string) => Promise<{ error: Error | null }>;
    };
    delete: () => {
      eq: (column: "id", value: string) => Promise<{ error: Error | null }>;
    };
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
      sourceUpdatedAt: string | null;
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
    forceRewrite?: boolean;
    rewrittenBy?: string;
  } = {},
): Promise<SweepstakeUpdateResult> {
  const promptPayload = buildSweepstakeUpdatePromptPayload(boardData);
  const inputHash = hashSweepstakeUpdatePayload(
    buildSweepstakeUpdateCachePayload(boardData),
  );
  const freshnessLabel = boardData.syncState.freshnessLabel;
  const supabase =
    options.supabase ??
    (getSupabaseServiceRoleClient() as unknown as SupabaseAiCacheClient);

  if (boardData.sweepstakeId !== "preview" && !options.forceRewrite) {
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
        generatedAt: cached.updated_at ?? cached.created_at,
        freshnessLabel,
        model: cached.model,
        sourceUpdatedAt: boardData.syncState.lastSuccessfulSyncAt,
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
  const previousGeneration =
    boardData.sweepstakeId === "preview"
      ? null
      : await readLatestReadySweepstakeUpdate({
          supabase,
          sweepstakeId: boardData.sweepstakeId,
          excludeInputHash: inputHash,
        });
  let generationClaim:
    | {
        generationId: string;
        previousOutputText: string;
      }
    | undefined;

  if (boardData.sweepstakeId !== "preview") {
    generationClaim = await claimSweepstakeUpdateGeneration({
      supabase,
      sweepstakeId: boardData.sweepstakeId,
      inputHash,
      sourceUpdatedAt: promptPayload.sourceUpdatedAt,
      model,
      forceRewrite: options.forceRewrite ?? false,
      rewrittenBy: options.rewrittenBy ?? null,
    });

    if (!generationClaim) {
      if (options.forceRewrite) {
        return {
          status: "unavailable",
          message: "The AI narrative is already being rewritten.",
          freshnessLabel,
        };
      }

      const cached = await waitForCachedSweepstakeUpdate({
        supabase,
        sweepstakeId: boardData.sweepstakeId,
        inputHash,
      });

      if (cached?.output_text) {
        return {
          status: "ready",
          text: cached.output_text,
          cached: true,
          generatedAt: cached.updated_at ?? cached.created_at,
          freshnessLabel,
          model: cached.model,
          sourceUpdatedAt: boardData.syncState.lastSuccessfulSyncAt,
        };
      }

      return {
        status: "unavailable",
        message:
          "The AI update is already being refreshed. Try opening it again shortly.",
        freshnessLabel,
      };
    }
  }

  let outputText: string;

  try {
    const openAiClient = options.openAiClient ?? createOpenAiResponse;
    const instructions = createSweepstakeUpdateInstructions(
      promptPayload.competitionState,
    );
    outputText = await openAiClient({
      apiKey,
      model,
      instructions,
      input: JSON.stringify(promptPayload),
    });
    let validation = validateSweepstakeUpdate(outputText, promptPayload);

    if (!validation.valid) {
      outputText = await openAiClient({
        apiKey,
        model,
        instructions: createSweepstakeUpdateCorrectionInstructions({
          competitionState: promptPayload.competitionState,
          errors: validation.errors,
        }),
        input: JSON.stringify({
          payload: promptPayload,
          rejectedOutput: outputText,
        }),
      });
      validation = validateSweepstakeUpdate(outputText, promptPayload);
    }

    if (!validation.valid) {
      if (generationClaim) {
        await releaseFailedGeneration({
          supabase,
          generationId: generationClaim.generationId,
          previousOutputText: generationClaim.previousOutputText,
        });
      }

      if (previousGeneration) {
        return {
          status: "ready",
          text: previousGeneration.output_text,
          cached: true,
          generatedAt:
            previousGeneration.updated_at ?? previousGeneration.created_at,
          freshnessLabel,
          model: previousGeneration.model,
          sourceUpdatedAt: boardData.syncState.lastSuccessfulSyncAt,
        };
      }

      return {
        status: "unavailable",
        message:
          "AI update is unavailable right now. The scoreboard data above is still the source of truth.",
        freshnessLabel,
      };
    }
  } catch (error) {
    if (generationClaim) {
      await releaseFailedGeneration({
        supabase,
        generationId: generationClaim.generationId,
        previousOutputText: generationClaim.previousOutputText,
      });
    }

    if (previousGeneration) {
      return {
        status: "ready",
        text: previousGeneration.output_text,
        cached: true,
        generatedAt:
          previousGeneration.updated_at ?? previousGeneration.created_at,
        freshnessLabel,
        model: previousGeneration.model,
        sourceUpdatedAt: boardData.syncState.lastSuccessfulSyncAt,
      };
    }

    throw error;
  }

  const generatedAt = new Date().toISOString();

  if (generationClaim) {
    await completeSweepstakeUpdateGeneration({
      supabase,
      generationId: generationClaim.generationId,
      model,
      outputText,
      reason: options.forceRewrite ? "admin_rewrite" : "automatic",
      rewrittenBy: options.rewrittenBy ?? null,
    });
  }

  return {
    status: "ready",
    text: outputText,
    cached: false,
    generatedAt,
    freshnessLabel,
    model,
    sourceUpdatedAt: boardData.syncState.lastSuccessfulSyncAt,
  };
}

export function buildSweepstakeUpdatePromptPayload(boardData: SharedBoardData) {
  const competitionState = getSweepstakeUpdateCompetitionState(boardData);
  const hasResultBackedBadges = competitionState !== "pre_tournament";
  const recentCompletedMatches = boardData.matches
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
    promptVersion: sweepstakeUpdatePromptVersion,
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
    recentCompletedMatches,
    upcomingOrDelayedMatches,
    scoringRules:
      "Group win 3, group draw 1, reach Round of 16 5, reach Quarter-final 8, reach Semi-final 12, runner-up 15, World Cup winner 25.",
  };
}

export function buildSweepstakeUpdateCachePayload(boardData: SharedBoardData) {
  return {
    feature: sweepstakeUpdateFeatureKey,
    promptVersion: sweepstakeUpdatePromptVersion,
    sweepstakeId: boardData.sweepstakeId,
    tournamentCode: boardData.tournamentCode,
    completedMatches: boardData.matches
      .filter((match) => match.status === "final")
      .map((match) => ({
        id: match.id,
        stage: match.stage,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      })),
    standings: boardData.standings.map((standing) => ({
      participantId: standing.participantId,
      name: standing.name,
      rank: standing.rank,
      points: standing.points,
      teamIds: [...standing.teamIds].sort(),
    })),
    badges: boardData.badges.map((badge) => ({
      id: badge.id,
      status: badge.status,
      holderParticipantIds: [...badge.holderParticipantIds].sort(),
      supportLine: badge.supportLine,
    })),
  };
}

function getSweepstakeUpdateCompetitionState(
  boardData: SharedBoardData,
): "pre_tournament" | "in_progress_or_complete" {
  const completedMatchCount = boardData.matches.filter(
    (match) => match.status === "final",
  ).length;
  const hasParticipantPoints = boardData.standings.some(
    (standing) => standing.points > 0,
  );

  if (completedMatchCount === 0 && !hasParticipantPoints) {
    return "pre_tournament";
  }

  return "in_progress_or_complete";
}

export function hashSweepstakeUpdatePayload(
  payload:
    | ReturnType<typeof buildSweepstakeUpdatePromptPayload>
    | ReturnType<typeof buildSweepstakeUpdateCachePayload>,
) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function createSweepstakeUpdateInstructions(
  competitionState: "pre_tournament" | "in_progress_or_complete",
) {
  const stateInstructions =
    competitionState === "pre_tournament"
      ? [
          "The payload is pre-tournament: there are no completed matches and every participant has zero points.",
          "You may say the tournament has not started from cached results and everyone is on zero.",
          "Do not name badge holders, leaders, podium chasers, winners, losers, or leaderboard drama.",
        ]
      : [
          "The tournament is in progress or complete: the payload has completed matches or non-zero participant points.",
          "Never say the tournament has not started, no results are in, or everyone is on zero.",
          "Use only completed results, current standings, badges, and fixtures explicitly present in the payload.",
        ];

  return [
    "You write a compact AI sweepstake update for a friendly World Cup 2026 office or group sweepstake.",
    "Use only the JSON payload supplied by the app. Do not use outside football knowledge.",
    "Do not invent scores, fixtures, lineups, injuries, form, statistics, badge holders, or standings.",
    "Do not describe leaderboard movement or say someone is still leading unless the payload includes prior standings; prefer current-position wording.",
    ...stateInstructions,
    "Do not make gambling-style advice or predictions. Avoid certainty about future outcomes.",
    "If cached data is missing, delayed, awaiting first sync, or not completed, say that plainly and briefly.",
    "Refer to freshness only as the football-data cache timestamp from the payload, not the current time or generation time.",
    "Write like a witty colleague: conversational, warm, dry, lightly cheeky, and natural rather than corporate or wooden.",
    "Use contractions where they sound natural. Allow at most one humorous observation in the entire update; do not force a joke.",
    "Avoid stock phrases including all to play for, things are heating up, and at the business end.",
    "Banter must stay kind, office-safe, and never mock or repeatedly target one participant.",
    "Prioritize what matters now: leader gap, podium chase, badge race, recent completed results, or team points. Skip low-signal facts.",
    "Call concluded matches completed matches or completed results. Never call them finals; use Final only when the payload stage is the tournament Final.",
    "Return plain text only in this exact shape: one short headline of 8 words or fewer, then 3 to 4 bullets. Each bullet must be 18 words or fewer.",
    "Do not add a separate cache note, sign-off, intro, or markdown heading. The app displays freshness beside the update.",
  ].join(" ");
}

export function createSweepstakeUpdateCorrectionInstructions({
  competitionState,
  errors,
}: {
  competitionState: "pre_tournament" | "in_progress_or_complete";
  errors: string[];
}) {
  return [
    createSweepstakeUpdateInstructions(competitionState),
    "Your previous draft was rejected by deterministic fact checks.",
    `Correct these errors: ${errors.join("; ")}.`,
    "Rewrite the complete update once. Do not explain the correction.",
  ].join(" ");
}

type SweepstakeUpdatePromptPayload = ReturnType<
  typeof buildSweepstakeUpdatePromptPayload
>;

export function validateSweepstakeUpdate(
  outputText: string,
  payload: SweepstakeUpdatePromptPayload,
) {
  const errors: string[] = [];
  const normalized = normalizeNarrativeText(outputText);
  const completedMatches = payload.recentCompletedMatches;
  const hasAnyCompletedMatches = payload.summary.finalMatchCount > 0;
  const hasAnyParticipantPoints = payload.standings.some(
    (standing) => standing.points > 0,
  );
  const preTournamentClaims = [
    /tournament (?:hasn['’]?t|has not) started/,
    /tournament (?:isn['’]?t|is not) underway/,
    /everyone(?:['’]s| is) (?:still )?on zero/,
    /no (?:completed )?results (?:are )?in/,
  ];

  if (
    (hasAnyCompletedMatches || hasAnyParticipantPoints) &&
    preTournamentClaims.some((pattern) => pattern.test(normalized))
  ) {
    errors.push(
      "pre-tournament wording contradicts completed matches or participant points",
    );
  }

  if (
    !hasAnyCompletedMatches &&
    /\b(?:completed result|completed match|beat|defeated|won \d|drew \d)/.test(
      normalized,
    )
  ) {
    errors.push("completed-result wording is unsupported");
  }

  validateScoreClaims(outputText, completedMatches, errors);
  validateFixtureClaims(outputText, payload, errors);
  validateParticipantClaims(outputText, payload, errors);

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  };
}

function validateScoreClaims(
  outputText: string,
  completedMatches: SweepstakeUpdatePromptPayload["recentCompletedMatches"],
  errors: string[],
) {
  const scorePattern = /\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/g;

  for (const line of outputText.split(/\r?\n/)) {
    for (const match of line.matchAll(scorePattern)) {
      const homeScore = Number(match[1]);
      const awayScore = Number(match[2]);
      const normalizedLine = normalizeNarrativeText(line);
      const supported = completedMatches.some((completedMatch) => {
        const hasTeams =
          normalizedLine.includes(
            normalizeNarrativeText(completedMatch.homeTeamName),
          ) &&
          normalizedLine.includes(
            normalizeNarrativeText(completedMatch.awayTeamName),
          );
        const hasScore =
          (completedMatch.homeScore === homeScore &&
            completedMatch.awayScore === awayScore) ||
          (completedMatch.homeScore === awayScore &&
            completedMatch.awayScore === homeScore);

        return hasTeams && hasScore;
      });

      if (!supported) {
        errors.push(`unsupported match score ${match[0]}`);
      }
    }
  }
}

function validateFixtureClaims(
  outputText: string,
  payload: SweepstakeUpdatePromptPayload,
  errors: string[],
) {
  const knownTeamNames = new Set(
    payload.teams.flatMap((team) => [team.name, team.shortName]).map(
      normalizeNarrativeText,
    ),
  );
  const fixturePattern = /(.+?)\s+(?:v|vs\.?|versus)\s+(.+)/i;

  for (const segment of outputText.split(/[,;\n]/)) {
    const match = segment.match(fixturePattern);

    if (!match) {
      continue;
    }

    const homeTeam = normalizeFixtureTeamName(match[1], "home");
    const awayTeam = normalizeFixtureTeamName(match[2], "away");

    if (!knownTeamNames.has(homeTeam) || !knownTeamNames.has(awayTeam)) {
      errors.push(`unsupported team name in fixture "${segment.trim()}"`);
    }
  }
}

function validateParticipantClaims(
  outputText: string,
  payload: SweepstakeUpdatePromptPayload,
  errors: string[],
) {
  const normalized = normalizeNarrativeText(outputText);
  const sharedRankPattern =
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+participants?\s+share\s+(second|third|fourth)\s+place(?:\s+on\s+(\d+)\s+points?)?/g;

  for (const match of normalized.matchAll(sharedRankPattern)) {
    const claimedCount = parseCount(match[1]);
    const claimedRank = { second: 2, third: 3, fourth: 4 }[
      match[2] as "second" | "third" | "fourth"
    ];
    const claimedPoints = match[3] ? Number(match[3]) : null;
    const matchingStandings = payload.standings.filter(
      (standing) =>
        standing.rank === claimedRank &&
        (claimedPoints === null || standing.points === claimedPoints),
    );

    if (matchingStandings.length !== claimedCount) {
      errors.push(
        `unsupported shared-rank claim for ${match[2]} place`,
      );
    }
  }

  for (const standing of payload.standings) {
    const participantName = normalizeNarrativeText(standing.name);

    if (!normalized.includes(participantName)) {
      continue;
    }

    const escapedName = escapeRegExp(participantName);
    const claimedPoints = [
      ...normalized.matchAll(
        new RegExp(
          `${escapedName}[^.\\n;]{0,50}?(?:on|with|has)\\s+(\\d+)(?:\\s+points?)?`,
          "g",
        ),
      ),
      ...normalized.matchAll(
        new RegExp(
          `(\\d+)\\s+points?[^.\\n;]{0,50}?${escapedName}`,
          "g",
        ),
      ),
    ].map((match) => Number(match[1]));

    if (claimedPoints.some((points) => points !== standing.points)) {
      errors.push(`unsupported points claim for ${standing.name}`);
    }

    if (
      new RegExp(
        `${escapedName}[^.\\n;]{0,50}?\\b(?:leads|leader|top spot|first place)\\b`,
      ).test(normalized) &&
      standing.rank !== 1
    ) {
      errors.push(`unsupported leader claim for ${standing.name}`);
    }

    const rankClaim = normalized.match(
      new RegExp(
        `${escapedName}[^.\\n;]{0,50}?\\b(second|third|fourth) place\\b`,
      ),
    );
    const claimedRank = rankClaim
      ? { second: 2, third: 3, fourth: 4 }[
          rankClaim[1] as "second" | "third" | "fourth"
        ]
      : null;

    if (claimedRank && standing.rank !== claimedRank) {
      errors.push(`unsupported rank claim for ${standing.name}`);
    }
  }
}

function normalizeNarrativeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeFixtureTeamName(
  value: string,
  side: "home" | "away",
) {
  let normalized = normalizeNarrativeText(value)
    .replace(/^[-•]\s*/, "")
    .replace(/^(?:and|next up|up next|upcoming|then)\s*:?\s*/, "");

  if (side === "home" && normalized.includes(":")) {
    normalized = normalized.slice(normalized.lastIndexOf(":") + 1).trim();
  }

  if (side === "away") {
    normalized = normalized
      .replace(/\s+(?:and|then)\s+.*$/, "")
      .replace(/[.!?]+$/, "")
      .trim();
  }

  return normalized;
}

function parseCount(value: string) {
  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  return words[value] ?? Number(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    .select("id, output_text, created_at, updated_at, model, generation_status")
    .eq("sweepstake_id", sweepstakeId)
    .eq("feature_key", sweepstakeUpdateFeatureKey)
    .eq("input_hash", inputHash)
    .eq("generation_status", "ready")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.output_text ? data : null;
}

async function readLatestReadySweepstakeUpdate({
  excludeInputHash,
  supabase,
  sweepstakeId,
}: {
  excludeInputHash: string;
  supabase: SupabaseAiCacheClient;
  sweepstakeId: string;
}) {
  const { data, error } = await supabase
    .from("ai_generations")
    .select("id, output_text, created_at, updated_at, model, generation_status")
    .eq("sweepstake_id", sweepstakeId)
    .eq("feature_key", sweepstakeUpdateFeatureKey)
    .eq("generation_status", "ready")
    .neq("input_hash", excludeInputHash)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.output_text ? data : null;
}

async function claimSweepstakeUpdateGeneration({
  forceRewrite,
  inputHash,
  model,
  rewrittenBy,
  sourceUpdatedAt,
  supabase,
  sweepstakeId,
}: {
  forceRewrite: boolean;
  inputHash: string;
  model: string;
  rewrittenBy: string | null;
  sourceUpdatedAt: string | null;
  supabase: SupabaseAiCacheClient;
  sweepstakeId: string;
}) {
  const { data, error } = await supabase.rpc("claim_ai_generation", {
    target_sweepstake_id: sweepstakeId,
    target_feature_key: sweepstakeUpdateFeatureKey,
    target_input_hash: inputHash,
    target_source_updated_at: sourceUpdatedAt,
    target_model: model,
    target_reason: forceRewrite ? "admin_rewrite" : "automatic",
    target_rewritten_by: rewrittenBy,
    force_rewrite: forceRewrite,
  });

  if (error) {
    throw error;
  }

  const claim = data?.[0];

  if (!claim?.claimed) {
    return undefined;
  }

  return {
    generationId: claim.generation_id,
    previousOutputText: claim.previous_output_text ?? "",
  };
}

async function completeSweepstakeUpdateGeneration({
  generationId,
  model,
  outputText,
  reason,
  rewrittenBy,
  supabase,
}: {
  generationId: string;
  model: string;
  outputText: string;
  reason: "automatic" | "admin_rewrite";
  rewrittenBy: string | null;
  supabase: SupabaseAiCacheClient;
}) {
  const { error } = await supabase
    .from("ai_generations")
    .update({
      output_text: outputText,
      model,
      generation_reason: reason,
      rewritten_by: rewrittenBy,
      generation_status: "ready",
      lease_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId);

  if (error) {
    throw error;
  }
}

async function releaseFailedGeneration({
  generationId,
  previousOutputText,
  supabase,
}: {
  generationId: string;
  previousOutputText: string;
  supabase: SupabaseAiCacheClient;
}) {
  if (!previousOutputText) {
    await supabase.from("ai_generations").delete().eq("id", generationId);
    return;
  }

  await supabase
    .from("ai_generations")
    .update({
      generation_status: "ready",
      lease_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId);
}

async function waitForCachedSweepstakeUpdate({
  inputHash,
  supabase,
  sweepstakeId,
}: {
  inputHash: string;
  supabase: SupabaseAiCacheClient;
  sweepstakeId: string;
}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const cached = await readCachedSweepstakeUpdate({
      supabase,
      sweepstakeId,
      inputHash,
    });

    if (cached) {
      return cached;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return null;
}
