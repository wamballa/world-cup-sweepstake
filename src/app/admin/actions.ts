"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/server/supabase/client";
import { requireSweepstakeAdmin } from "@/server/supabase/admin-auth";
import type { TeamAllocation } from "@/features/allocation/fair-allocation";
import { prepareBulkParticipantCreate } from "@/features/participants/bulk-participant-parser";
import { recalculateSweepstakeScores } from "@/server/football-data/recalculate";
import { runFootballDataSync } from "@/server/football-data/sync";
import {
  defaultFootballDataTournament,
  getFootballDataTournamentByCode,
  isSupportedFootballDataTournamentCode,
} from "@/features/tournaments/world-cup";
import {
  buildTournamentChangePatch,
  buildHistoricalTournamentSyncFailureMessage,
  buildTournamentResetAuditInsert,
  tournamentDependentSweepstakeTables,
} from "@/server/sweepstakes/tournament-change";

type LooseSupabaseClient = {
  from: (table: string) => {
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
    insert: (values: unknown) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown>; error: Error | null }>;
      };
    } & PromiseLike<{ error: Error | null }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>;
      };
    };
    upsert: (values: unknown) => Promise<{ error: Error | null }>;
  };
};

const badgeCategoriesTable = "badge_categories" as string;
const participantEmailsTable = "participant_emails" as string;
const participantsTable = "participants" as string;
const profilesTable = "profiles" as string;
const sweepstakeAdminsTable = "sweepstake_admins" as string;
const sweepstakesTable = "sweepstakes" as string;
const teamAllocationsTable = "team_allocations" as string;
const allocationAuditEventsTable = "allocation_audit_events" as string;
const sharedViewModes = ["participant_board", "countdown"] as const;
type SharedViewMode = (typeof sharedViewModes)[number];

const defaultBadgeCategories = [
  { key: "first-place", label: "1st Place" },
  { key: "second-place", label: "2nd Place" },
  { key: "third-place", label: "3rd Place" },
  { key: "fourth-place", label: "4th Place" },
  { key: "wooden-spoon", label: "Wooden Spoon" },
  { key: "first-knocked-out", label: "First Knocked Out" },
  { key: "most-goals-conceded", label: "Most Goals Conceded" },
  { key: "fewest-goals-scored", label: "Fewest Goals Scored" },
  {
    key: "most-cards",
    label: "Most Cards",
    status: "manual_future" as const,
    is_enabled: false,
  },
  {
    key: "golden-boot-team",
    label: "Golden Boot Team",
    status: "manual_future" as const,
    is_enabled: false,
  },
  {
    key: "golden-glove-team",
    label: "Golden Glove Team",
    status: "manual_future" as const,
    is_enabled: false,
  },
];

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

export async function createOwnedSweepstake(name: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to create a sweepstake.");
  }

  const serviceSupabase =
    getSupabaseServiceRoleClient() as unknown as LooseSupabaseClient;
  const { error: profileError } = await serviceSupabase.from(profilesTable).upsert([
    {
      id: user.id,
      display_name: user.user_metadata.name ?? user.email ?? "Admin",
    },
  ]);

  if (profileError) {
    throw profileError;
  }

  const { data: sweepstake, error: sweepstakeError } = await serviceSupabase
    .from(sweepstakesTable)
    .insert([
      {
        name: name.trim(),
        tournament_code: defaultFootballDataTournament.code,
        status: "draft",
        share_token: createShareToken(),
        created_by: user.id,
      },
    ])
    .select("id, name, share_token")
    .single();

  if (sweepstakeError) {
    throw sweepstakeError;
  }

  const { error: adminError } = await serviceSupabase.from(sweepstakeAdminsTable).insert([
    {
      sweepstake_id: sweepstake.id,
      user_id: user.id,
      role: "owner",
      invited_email: null,
    },
  ]);

  if (adminError) {
    throw adminError;
  }

  const { error: badgeError } = await serviceSupabase.from(badgeCategoriesTable).insert(
    defaultBadgeCategories.map((badgeCategory, index) => ({
      sweepstake_id: sweepstake.id,
      key: badgeCategory.key,
      label: badgeCategory.label,
      status: badgeCategory.status ?? "active",
      sort_order: index,
      is_enabled: badgeCategory.is_enabled ?? true,
    })),
  );

  if (badgeError) {
    throw badgeError;
  }

  const teams = await loadDrawTeams(defaultFootballDataTournament.code);

  revalidatePath("/admin");

  return {
    id: String(sweepstake.id),
    name: String(sweepstake.name),
    shareToken: String(sweepstake.share_token),
    tournamentCode: defaultFootballDataTournament.code,
    tournamentLabel: defaultFootballDataTournament.label,
    sharedViewMode: "participant_board" as const,
    isOwner: true,
    participants: [],
    adminEmails: "",
    teams,
    allocations: [],
    auditEvents: [],
  };
}

export async function changeSweepstakeTournament(input: {
  sweepstakeId: string;
  tournamentCode: string;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  if (!isSupportedFootballDataTournamentCode(input.tournamentCode)) {
    return {
      ok: false,
      message: "Choose a supported tournament dataset.",
    };
  }

  const { data: sweepstake, error: sweepstakeError } = await supabase
    .from(sweepstakesTable)
    .select("tournament_code")
    .eq("id", input.sweepstakeId)
    .single();

  if (sweepstakeError) {
    throw sweepstakeError;
  }

  const previousTournament = getFootballDataTournamentByCode(
    String(sweepstake.tournament_code),
  );
  const nextTournament = getFootballDataTournamentByCode(input.tournamentCode);

  if (previousTournament.code === nextTournament.code) {
    return {
      ok: true,
      tournamentCode: nextTournament.code,
      tournamentLabel: nextTournament.label,
      teams: await loadDrawTeams(nextTournament.code),
      message: "",
    };
  }

  const syncWarning = await ensureTournamentCache(nextTournament.code);
  const nextTeams = await loadDrawTeams(nextTournament.code);

  if (nextTeams.length === 0) {
    return {
      ok: false,
      message:
        syncWarning ||
        `No cached teams are available for ${nextTournament.label}. The sweepstake is still using ${previousTournament.label}; no draw was reset.`,
    };
  }

  const serviceSupabase =
    getSupabaseServiceRoleClient() as unknown as LooseSupabaseClient;

  for (const table of tournamentDependentSweepstakeTables) {
    await deleteSweepstakeRows(serviceSupabase, table, input.sweepstakeId);
  }

  const { error: updateError } = await supabase
    .from(sweepstakesTable)
    .update(buildTournamentChangePatch(nextTournament.code))
    .eq("id", input.sweepstakeId);

  if (updateError) {
    throw updateError;
  }

  const auditInsert = buildTournamentResetAuditInsert({
    sweepstakeId: input.sweepstakeId,
    actorUserId: user.id,
    previousTournamentCode: previousTournament.code,
    previousTournamentLabel: previousTournament.label,
    nextTournamentCode: nextTournament.code,
    nextTournamentLabel: nextTournament.label,
  });
  const { error: auditError } = await supabase
    .from(allocationAuditEventsTable)
    .insert(auditInsert);

  if (auditError) {
    throw auditError;
  }

  revalidatePath("/admin");

  return {
    ok: true,
    tournamentCode: nextTournament.code,
    tournamentLabel: nextTournament.label,
    teams: nextTeams,
    message: syncWarning,
  };
}

export async function archiveOwnedSweepstake(sweepstakeId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeOwner(supabase, user.id, sweepstakeId);

  const { error } = await supabase
    .from(sweepstakesTable)
    .update({ status: "archived" })
    .eq("id", sweepstakeId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin");
}

export async function createSweepstakeParticipant(input: {
  sweepstakeId: string;
  name: string;
  email?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  const name = normalizeParticipantName(input.name);
  const email = normalizeParticipantEmail(input.email);

  await assertUniqueParticipantName({
    sweepstakeId: input.sweepstakeId,
    name,
  });

  const { data: existingRows, error: existingError } = await supabase
    .from(participantsTable)
    .select("sort_order")
    .eq("sweepstake_id", input.sweepstakeId);

  if (existingError) {
    throw existingError;
  }

  const nextSortOrder = existingRows?.length ?? 0;
  const { data: participantRow, error: participantError } = await supabase
    .from(participantsTable)
    .insert({
      sweepstake_id: input.sweepstakeId,
      display_name: name,
      sort_order: nextSortOrder,
    })
    .select("id, display_name")
    .single();

  if (participantError) {
    throwParticipantWriteError(participantError);
  }

  await saveParticipantEmail(participantRow.id, email);
  revalidatePath("/admin");

  return {
    id: String(participantRow.id),
    name: String(participantRow.display_name),
    email,
  };
}

export async function createSweepstakeParticipantsBulk(input: {
  sweepstakeId: string;
  names: string[];
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  const { data: existingRows, error: existingError } = await supabase
    .from(participantsTable)
    .select("display_name, sort_order")
    .eq("sweepstake_id", input.sweepstakeId);

  if (existingError) {
    throw existingError;
  }

  const bulkParticipantCreate = prepareBulkParticipantCreate({
    existingParticipants: (existingRows ?? []).map((participant) => {
      const sortOrder = Number(participant.sort_order);

      return {
        displayName: String(participant.display_name),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : null,
      };
    }),
    names: input.names,
  });

  if (bulkParticipantCreate.names.length === 0) {
    return [];
  }

  const { data: participantRows, error: participantError } = await supabase
    .from(participantsTable)
    .insert(
      bulkParticipantCreate.names.map((name, index) => ({
        sweepstake_id: input.sweepstakeId,
        display_name: name,
        sort_order: bulkParticipantCreate.nextSortOrder + index,
      })),
    )
    .select("id, display_name");

  if (participantError) {
    throwParticipantWriteError(participantError);
  }

  revalidatePath("/admin");

  return (participantRows ?? []).map((participantRow) => ({
    id: String(participantRow.id),
    name: String(participantRow.display_name),
    email: "",
  }));
}

export async function updateSweepstakeParticipant(input: {
  sweepstakeId: string;
  participantId: string;
  name: string;
  email?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  if (!isUuid(input.participantId)) {
    throw new Error("A valid participant is required.");
  }

  const name = normalizeParticipantName(input.name);
  const email = normalizeParticipantEmail(input.email);

  await assertUniqueParticipantName({
    sweepstakeId: input.sweepstakeId,
    participantId: input.participantId,
    name,
  });

  const { data: participantRow, error: participantError } = await supabase
    .from(participantsTable)
    .update({ display_name: name })
    .eq("sweepstake_id", input.sweepstakeId)
    .eq("id", input.participantId)
    .select("id, display_name")
    .single();

  if (participantError) {
    throwParticipantWriteError(participantError);
  }

  await saveParticipantEmail(participantRow.id, email);
  revalidatePath("/admin");

  return {
    id: String(participantRow.id),
    name: String(participantRow.display_name),
    email,
  };
}

export async function deleteSweepstakeParticipant(input: {
  sweepstakeId: string;
  participantId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  if (!isUuid(input.participantId)) {
    throw new Error("A valid participant is required.");
  }

  const { error } = await supabase
    .from(participantsTable)
    .delete()
    .eq("sweepstake_id", input.sweepstakeId)
    .eq("id", input.participantId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin");
}

export async function saveSweepstakeParticipants(
  sweepstakeId: string,
  participants: Array<{ id?: string; name: string; email?: string }>,
) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, sweepstakeId);

  const cleanParticipants = participants
    .map((participant) => ({
      id: isUuid(participant.id) ? participant.id : undefined,
      name: participant.name.trim(),
      email: participant.email?.trim().toLowerCase() ?? "",
    }))
    .filter((participant) => participant.name.length > 0);

  const { data: existingRows, error: existingError } = await supabase
    .from(participantsTable)
    .select("id")
    .eq("sweepstake_id", sweepstakeId);

  if (existingError) {
    throw existingError;
  }

  const keptParticipantIds = new Set(
    cleanParticipants
      .map((participant) => participant.id)
      .filter((participantId): participantId is string => Boolean(participantId)),
  );
  const participantIdsToDelete = (existingRows ?? [])
    .map((participant) => String(participant.id))
    .filter((participantId) => !keptParticipantIds.has(participantId));

  for (const participantId of participantIdsToDelete) {
    const { error: deleteError } = await supabase
      .from(participantsTable)
      .delete()
      .eq("sweepstake_id", sweepstakeId)
      .eq("id", participantId);

    if (deleteError) {
      throw deleteError;
    }
  }

  const savedParticipants = [];

  for (const [index, participant] of cleanParticipants.entries()) {
    const participantPayload = {
      sweepstake_id: sweepstakeId,
      display_name: participant.name,
      sort_order: index,
    };

    const result = participant.id
      ? await supabase
          .from(participantsTable)
          .update(participantPayload)
          .eq("sweepstake_id", sweepstakeId)
          .eq("id", participant.id)
          .select("id, display_name")
          .single()
      : await supabase
          .from(participantsTable)
          .insert(participantPayload)
          .select("id, display_name")
          .single();

    if (result.error) {
      throw result.error;
    }

    const participantRow = result.data;

    if (participant.email) {
      const { error: emailError } = await supabase
        .from(participantEmailsTable)
        .upsert({
          participant_id: participantRow.id,
          email: participant.email,
          update_opt_in: true,
        });

      if (emailError) {
        throw emailError;
      }
    } else {
      const { error: emailDeleteError } = await supabase
        .from(participantEmailsTable)
        .delete()
        .eq("participant_id", participantRow.id);

      if (emailDeleteError) {
        throw emailDeleteError;
      }
    }

    savedParticipants.push({
      id: String(participantRow.id),
      name: String(participantRow.display_name),
      email: participant.email,
    });
  }

  revalidatePath("/admin");

  return savedParticipants;
}

export async function saveSweepstakeSettings(input: {
  sweepstakeId: string;
  name: string;
  invitedAdminEmails: string[];
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  const { error: sweepstakeError } = await supabase
    .from(sweepstakesTable)
    .update({ name: input.name.trim() })
    .eq("id", input.sweepstakeId);

  if (sweepstakeError) {
    throw sweepstakeError;
  }

  const { error: deleteInviteError } = await supabase
    .from(sweepstakeAdminsTable)
    .delete()
    .eq("sweepstake_id", input.sweepstakeId)
    .not("invited_email", "is", null);

  if (deleteInviteError) {
    throw deleteInviteError;
  }

  const invitedAdminEmails = [
    ...new Set(
      input.invitedAdminEmails
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (invitedAdminEmails.length > 0) {
    const { error: insertInviteError } = await supabase
      .from(sweepstakeAdminsTable)
      .insert(
        invitedAdminEmails.map((email) => ({
          sweepstake_id: input.sweepstakeId,
          user_id: null,
          role: "admin",
          invited_email: email,
        })),
      );

    if (insertInviteError) {
      throw insertInviteError;
    }
  }

  revalidatePath("/admin");
}

export async function saveSweepstakeSharedViewMode(input: {
  sweepstakeId: string;
  sharedViewMode: SharedViewMode;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);

  if (!sharedViewModes.includes(input.sharedViewMode)) {
    throw new Error("Choose a valid shared-link display mode.");
  }

  const { error } = await supabase
    .from(sweepstakesTable)
    .update({ shared_view_mode: input.sharedViewMode })
    .eq("id", input.sweepstakeId);

  if (error) {
    if (isMissingSharedViewModeColumnError(error)) {
      throw new Error(
        "Countdown page mode is ready in the app, but the Supabase migration has not been applied yet. Apply supabase/migrations/20260524103000_shared_view_mode.sql, then try again.",
      );
    }

    throw error;
  }

  revalidatePath("/admin");
}

function isMissingSharedViewModeColumnError(error: Error & { code?: string }) {
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.message.includes("shared_view_mode")
  );
}

export async function saveSweepstakeAllocation(input: {
  sweepstakeId: string;
  action: "initial-draw" | "rerun" | "manual-move";
  note: string;
  allocations: TeamAllocation[];
}) {
  const supabase = await createSupabaseServerClient();
  const user = await requireCurrentUser();

  await requireSweepstakeAdmin(supabase, user.id, input.sweepstakeId);
  await assertAllocationsMatchSweepstakeTournament({
    supabase,
    sweepstakeId: input.sweepstakeId,
    allocations: input.allocations,
  });

  const { error: deleteError } = await supabase
    .from(teamAllocationsTable)
    .delete()
    .eq("sweepstake_id", input.sweepstakeId);

  if (deleteError) {
    throw deleteError;
  }

  if (input.allocations.length > 0) {
    const { error: allocationError } = await supabase
      .from(teamAllocationsTable)
      .insert(
        input.allocations.map((allocation) => ({
          sweepstake_id: input.sweepstakeId,
          participant_id: allocation.participantId,
          team_id: allocation.teamId,
        })),
      );

    if (allocationError) {
      throw allocationError;
    }

    const { error: shareError } = await supabase
      .from(sweepstakesTable)
      .update({ status: "shared" })
      .eq("id", input.sweepstakeId);

    if (shareError) {
      throw shareError;
    }

    await recalculateSweepstakeScores(
      getSupabaseServiceRoleClient(),
      input.sweepstakeId,
      new Date().toISOString(),
    );
  }

  const { error: auditError } = await supabase
    .from(allocationAuditEventsTable)
    .insert({
      sweepstake_id: input.sweepstakeId,
      action: toDatabaseAllocationAction(input.action),
      actor_user_id: user.id,
      note: input.note,
      metadata: {
        allocationCount: input.allocations.length,
      },
    });

  if (auditError) {
    throw auditError;
  }

  revalidatePath("/admin");
}

async function assertAllocationsMatchSweepstakeTournament({
  supabase,
  sweepstakeId,
  allocations,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  sweepstakeId: string;
  allocations: TeamAllocation[];
}) {
  if (allocations.length === 0) {
    return;
  }

  const { data: sweepstake, error: sweepstakeError } = await supabase
    .from(sweepstakesTable)
    .select("tournament_code")
    .eq("id", sweepstakeId)
    .single();

  if (sweepstakeError) {
    throw sweepstakeError;
  }

  const teamIds = [...new Set(allocations.map((allocation) => allocation.teamId))];
  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_code", String(sweepstake.tournament_code))
    .in("id", teamIds);

  if (teamError) {
    throw teamError;
  }

  if ((teamRows ?? []).length !== teamIds.length) {
    throw new Error(
      "The saved draw uses teams from a different tournament dataset. Refresh the admin page, then run the draw again.",
    );
  }
}

async function requireCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return user;
}

function normalizeParticipantName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Participant name is required.");
  }

  if (normalizedName.length > 80) {
    throw new Error("Participant name must be 80 characters or fewer.");
  }

  return normalizedName;
}

function normalizeParticipantEmail(email: string | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

async function assertUniqueParticipantName({
  sweepstakeId,
  participantId,
  name,
}: {
  sweepstakeId: string;
  participantId?: string;
  name: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(participantsTable)
    .select("id, display_name")
    .eq("sweepstake_id", sweepstakeId);

  if (error) {
    throw error;
  }

  const normalizedName = name.toLowerCase();
  const duplicate = (data ?? []).some(
    (participant) =>
      String(participant.id) !== participantId &&
      String(participant.display_name).trim().toLowerCase() === normalizedName,
  );

  if (duplicate) {
    throw new Error("Another participant already uses that name.");
  }
}

async function saveParticipantEmail(participantId: string, email: string) {
  const supabase = await createSupabaseServerClient();

  if (email) {
    const { error } = await supabase.from(participantEmailsTable).upsert({
      participant_id: participantId,
      email,
      update_opt_in: true,
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from(participantEmailsTable)
    .delete()
    .eq("participant_id", participantId);

  if (error) {
    throw error;
  }
}

function throwParticipantWriteError(error: Error): never {
  if (error.message.toLowerCase().includes("duplicate")) {
    throw new Error("Another participant already uses that name.");
  }

  throw error;
}

async function requireSweepstakeOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  sweepstakeId: string,
) {
  const { data, error } = await supabase
    .from(sweepstakeAdminsTable)
    .select("user_id")
    .eq("sweepstake_id", sweepstakeId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Only the sweepstake owner can archive this sweepstake.");
  }

  return data;
}

function toDatabaseAllocationAction(action: "initial-draw" | "rerun" | "manual-move") {
  if (action === "initial-draw") {
    return "initial_draw";
  }

  if (action === "manual-move") {
    return "manual_move";
  }

  return "rerun";
}

async function ensureTournamentCache(tournamentCode: string) {
  const existingTeams = await loadDrawTeams(tournamentCode);

  if (existingTeams.length > 0) {
    return "";
  }

  try {
    const result = await runFootballDataSync({
      supabase: getSupabaseServiceRoleClient(),
      tournamentCode,
      trigger: "manual",
      forceFullSync: true,
    });

    if (result.status === "failed") {
      return formatHistoricalSyncFailure(tournamentCode, result.errorMessage);
    }

    if (result.status === "skipped") {
      return "Tournament dataset sync was skipped by the football-data.org cooldown. Try again shortly if teams have not appeared yet.";
    }

    return "";
  } catch (error) {
    return error instanceof Error
      ? formatHistoricalSyncFailure(tournamentCode, error.message)
      : "Tournament dataset sync could not run.";
  }
}

function formatHistoricalSyncFailure(
  tournamentCode: string,
  errorMessage: string | undefined,
) {
  const tournament = getFootballDataTournamentByCode(tournamentCode);

  if (errorMessage?.includes("403")) {
    return buildHistoricalTournamentSyncFailureMessage({
      tournamentLabel: tournament.label,
      errorMessage,
    });
  }

  return buildHistoricalTournamentSyncFailureMessage({
    tournamentLabel: tournament.label,
    errorMessage,
  });
}

async function deleteSweepstakeRows(
  supabase: LooseSupabaseClient,
  table: string,
  sweepstakeId: string,
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("sweepstake_id", sweepstakeId);

  if (error) {
    throw error;
  }
}

async function loadDrawTeams(tournamentCode: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, short_name, group_name")
    .eq("tournament_code", tournamentCode)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((team) => ({
    id: String(team.id),
    name: String(team.name),
    shortName:
      typeof team.short_name === "string"
        ? team.short_name
        : createShortTeamName(String(team.name)),
    groupName: typeof team.group_name === "string" ? team.group_name : null,
  }));
}

function createShortTeamName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function createShareToken() {
  return randomBytes(24).toString("base64url");
}
