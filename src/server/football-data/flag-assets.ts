import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type TeamFlagAssetResult = {
  attempted: number;
  stored: number;
  skipped: number;
  failed: number;
  errorMessage?: string;
};

export type FlagAssetTeam = {
  id: string;
  external_id: string | null;
  name: string;
  flag_source_url: string | null;
};

const teamFlagsBucket = "team-flags";
const defaultBatchSize = 48;
const defaultDelayMs = 250;
const supportedMimeTypes = new Map([
  ["image/svg+xml", "svg"],
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function cacheTeamFlagAssets(
  supabase: SupabaseClient,
  input: {
    tournamentCode: string;
    fetchImpl?: typeof fetch;
    batchSize?: number;
    delayMs?: number;
  },
): Promise<TeamFlagAssetResult> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, external_id, name, flag_source_url")
    .eq("tournament_code", input.tournamentCode)
    .not("flag_source_url", "is", null)
    .is("flag_asset_path", null)
    .limit(input.batchSize ?? defaultBatchSize);

  if (error) {
    throw error;
  }

  const teams = (data ?? []) as FlagAssetTeam[];
  const fetchImpl = input.fetchImpl ?? fetch;
  let stored = 0;
  let failed = 0;

  for (const [index, team] of teams.entries()) {
    if (index > 0 && input.delayMs !== 0) {
      await delay(input.delayMs ?? defaultDelayMs);
    }

    const result = await copyTeamFlagAsset(supabase, {
      fetchImpl,
      team,
      tournamentCode: input.tournamentCode,
    });

    if (result === "stored") {
      stored += 1;
    } else {
      failed += 1;
    }
  }

  return {
    attempted: teams.length,
    stored,
    skipped: teams.length === 0 ? 1 : 0,
    failed,
  };
}

export async function copyTeamFlagAsset(
  supabase: SupabaseClient,
  input: {
    fetchImpl: typeof fetch;
    team: FlagAssetTeam;
    tournamentCode: string;
  },
) {
  const flagSourceUrl = input.team.flag_source_url;

  if (!flagSourceUrl || !isAllowedFlagSourceUrl(flagSourceUrl)) {
    return "failed" as const;
  }

  const response = await input.fetchImpl(flagSourceUrl);

  if (!response.ok) {
    return "failed" as const;
  }

  const contentType = normalizeContentType(response.headers.get("content-type"));
  const extension = contentType ? supportedMimeTypes.get(contentType) : null;

  if (!contentType || !extension) {
    return "failed" as const;
  }

  const bytes = await response.arrayBuffer();
  const storagePath = buildFlagStoragePath({
    extension,
    team: input.team,
    tournamentCode: input.tournamentCode,
  });
  const { error: uploadError } = await supabase.storage
    .from(teamFlagsBucket)
    .upload(storagePath, bytes, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    return "failed" as const;
  }

  const { data } = supabase.storage
    .from(teamFlagsBucket)
    .getPublicUrl(storagePath);
  const { error: updateError } = await supabase
    .from("teams")
    .update({ flag_asset_path: data.publicUrl })
    .eq("id", input.team.id);

  if (updateError) {
    return "failed" as const;
  }

  return "stored" as const;
}

export function buildFlagStoragePath({
  extension,
  team,
  tournamentCode,
}: {
  extension: string;
  team: Pick<FlagAssetTeam, "external_id" | "id" | "name">;
  tournamentCode: string;
}) {
  const stableId = team.external_id ?? team.id;
  const slug = team.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${tournamentCode}/${stableId}-${slug || "team"}.${extension}`;
}

function isAllowedFlagSourceUrl(flagSourceUrl: string) {
  try {
    const url = new URL(flagSourceUrl);

    return url.protocol === "https:" && url.hostname === "crests.football-data.org";
  } catch {
    return false;
  }
}

function normalizeContentType(contentType: string | null) {
  return contentType?.split(";")[0]?.trim().toLowerCase() ?? null;
}

function delay(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
