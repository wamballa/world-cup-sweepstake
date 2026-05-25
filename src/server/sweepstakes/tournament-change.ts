import type { Database } from "@/server/supabase/database.types";

export const tournamentDependentSweepstakeTables = [
  "team_allocations",
  "team_scores",
  "participant_scores",
  "badge_holders",
  "ai_generations",
  "email_update_logs",
] as const;

export type TournamentDependentSweepstakeTable =
  (typeof tournamentDependentSweepstakeTables)[number];

export function buildTournamentResetAuditInsert(input: {
  sweepstakeId: string;
  actorUserId: string;
  previousTournamentCode: string;
  previousTournamentLabel: string;
  nextTournamentCode: string;
  nextTournamentLabel: string;
}) {
  return {
    sweepstake_id: input.sweepstakeId,
    action: "rerun" satisfies Database["public"]["Enums"]["allocation_audit_action"],
    actor_user_id: input.actorUserId,
    note: `Tournament changed from ${input.previousTournamentLabel} to ${input.nextTournamentLabel}. Existing draw and derived results were reset.`,
    metadata: {
      actionKind: "tournament_reset",
      previousTournamentCode: input.previousTournamentCode,
      nextTournamentCode: input.nextTournamentCode,
    },
  };
}

export function buildTournamentChangePatch(tournamentCode: string) {
  return {
    tournament_code: tournamentCode,
    status: "draft" satisfies Database["public"]["Enums"]["sweepstake_status"],
  };
}

export function buildHistoricalTournamentSyncFailureMessage(input: {
  tournamentLabel: string;
  errorMessage?: string;
}) {
  if (input.errorMessage?.includes("403")) {
    return `football-data.org rejected ${input.tournamentLabel} with 403. Your current API plan or token does not allow that dataset, so the sweepstake stayed on its current tournament and no draw was reset.`;
  }

  return input.errorMessage ?? `Tournament dataset sync failed for ${input.tournamentLabel}.`;
}
