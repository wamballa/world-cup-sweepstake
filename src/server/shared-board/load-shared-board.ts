import "server-only";

import { buildSharedBoardData } from "@/features/shared-board/shared-board-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";

type ShareTokenSweepstake = {
  id: string;
  name: string;
  tournament_code: string;
  shared_view_mode: "participant_board" | "countdown";
};

export async function loadSharedBoardByShareToken(shareToken: string) {
  const publicSupabase = await createSupabaseServerClient();
  const { data, error } = await publicSupabase
    .rpc("get_sweepstake_by_share_token", {
      target_share_token: shareToken,
    })
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const sharedSweepstake = data as ShareTokenSweepstake;
  const sweepstake = {
    id: sharedSweepstake.id,
    name: sharedSweepstake.name,
    tournament_code: sharedSweepstake.tournament_code,
    shared_view_mode: sharedSweepstake.shared_view_mode,
  };
  const serviceSupabase = getSupabaseServiceRoleClient();

  const [
    participantsResult,
    allocationsResult,
    teamsResult,
    teamScoresResult,
    participantScoresResult,
    badgeCategoriesResult,
    badgeHoldersResult,
    matchesResult,
    syncStateResult,
  ] = await Promise.all([
    serviceSupabase
      .from("participants")
      .select("id, display_name, sort_order")
      .eq("sweepstake_id", sweepstake.id)
      .order("sort_order", { ascending: true }),
    serviceSupabase
      .from("team_allocations")
      .select("participant_id, team_id")
      .eq("sweepstake_id", sweepstake.id),
    serviceSupabase
      .from("teams")
      .select("id, name, short_name, group_name, flag_asset_path")
      .eq("tournament_code", sweepstake.tournament_code)
      .order("name", { ascending: true }),
    serviceSupabase
      .from("team_scores")
      .select("team_id, points")
      .eq("sweepstake_id", sweepstake.id),
    serviceSupabase
      .from("participant_scores")
      .select("participant_id, points, rank, team_count")
      .eq("sweepstake_id", sweepstake.id),
    serviceSupabase
      .from("badge_categories")
      .select("id, key, label, status, sort_order, is_enabled")
      .eq("sweepstake_id", sweepstake.id)
      .order("sort_order", { ascending: true }),
    serviceSupabase
      .from("badge_holders")
      .select("badge_category_id, participant_id, team_id, reason")
      .eq("sweepstake_id", sweepstake.id),
    serviceSupabase
      .from("matches")
      .select("id, stage, status, home_team_id, away_team_id, home_score, away_score, kickoff_at, data_freshness")
      .eq("tournament_code", sweepstake.tournament_code)
      .order("kickoff_at", { ascending: true, nullsFirst: false }),
    serviceSupabase
      .from("football_data_sync_state")
      .select("last_successful_sync_at, updated_at")
      .eq("key", sweepstake.tournament_code)
      .maybeSingle(),
  ]);

  const results = [
    participantsResult,
    allocationsResult,
    teamsResult,
    teamScoresResult,
    participantScoresResult,
    badgeCategoriesResult,
    badgeHoldersResult,
    matchesResult,
    syncStateResult,
  ];
  const failedResult = results.find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  const participantIds = (participantsResult.data ?? []).map(
    (participant: { id: string }) => participant.id,
  );
  const participantEmailPreferencesResult =
    participantIds.length > 0
      ? await serviceSupabase
          .from("participant_emails")
          .select("participant_id, update_opt_in")
          .in("participant_id", participantIds)
      : { data: [], error: null };

  if (participantEmailPreferencesResult.error) {
    throw participantEmailPreferencesResult.error;
  }

  return buildSharedBoardData({
    sweepstake,
    participants: participantsResult.data ?? [],
    participantEmailPreferences: participantEmailPreferencesResult.data ?? [],
    allocations: allocationsResult.data ?? [],
    teams: teamsResult.data ?? [],
    teamScores: teamScoresResult.data ?? [],
    participantScores: participantScoresResult.data ?? [],
    badgeCategories: badgeCategoriesResult.data ?? [],
    badgeHolders: badgeHoldersResult.data ?? [],
    matches: matchesResult.data ?? [],
    syncState: syncStateResult.data ?? null,
  });
}
