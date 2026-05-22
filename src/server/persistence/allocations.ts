import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { TeamAllocation } from "@/features/allocation/fair-allocation";
import type { Database, Json } from "@/server/supabase/database.types";

export type PersistAllocationInput = {
  sweepstakeId: string;
  actorUserId: string;
  action: Database["public"]["Enums"]["allocation_audit_action"];
  note: string;
  allocations: TeamAllocation[];
  metadata?: Json;
};

export function buildAllocationInserts(input: PersistAllocationInput) {
  return input.allocations.map((allocation) => ({
    sweepstake_id: input.sweepstakeId,
    participant_id: allocation.participantId,
    team_id: allocation.teamId,
  }));
}

export function buildAllocationAuditInsert(input: PersistAllocationInput) {
  return {
    sweepstake_id: input.sweepstakeId,
    action: input.action,
    actor_user_id: input.actorUserId,
    note: input.note,
    metadata: input.metadata ?? {},
  };
}

export async function replacePersistedAllocation(
  supabase: SupabaseClient,
  input: PersistAllocationInput,
) {
  const { error: deleteError } = await supabase
    .from("team_allocations")
    .delete()
    .eq("sweepstake_id", input.sweepstakeId);

  if (deleteError) {
    throw deleteError;
  }

  const { error: allocationError } = await supabase
    .from("team_allocations")
    .insert(buildAllocationInserts(input));

  if (allocationError) {
    throw allocationError;
  }

  const { error: auditError } = await supabase
    .from("allocation_audit_events")
    .insert(buildAllocationAuditInsert(input));

  if (auditError) {
    throw auditError;
  }
}
