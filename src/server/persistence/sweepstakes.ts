import "server-only";

import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/server/supabase/database.types";

export type BadgeCategoryDraft = {
  key: string;
  label: string;
  status?: Database["public"]["Enums"]["badge_status"];
  sortOrder?: number;
  isEnabled?: boolean;
};

export type ParticipantDraft = {
  displayName: string;
  email?: string;
};

export type PersistSweepstakeSetupInput = {
  name: string;
  createdBy: string;
  adminUserIds?: string[];
  invitedAdminEmails?: string[];
  participants: ParticipantDraft[];
  badgeCategories: BadgeCategoryDraft[];
};

export function buildSweepstakeInsert(input: PersistSweepstakeSetupInput) {
  return {
    name: input.name.trim(),
    tournament_code: "WC_2026",
    status: "draft" as const,
    share_token: createShareToken(),
    created_by: input.createdBy,
  };
}

export function buildAdminInserts(
  sweepstakeId: string,
  input: PersistSweepstakeSetupInput,
) {
  const owner = {
    sweepstake_id: sweepstakeId,
    user_id: input.createdBy,
    role: "owner" as const,
    invited_email: null,
  };

  const admins = (input.adminUserIds ?? [])
    .filter((userId) => userId !== input.createdBy)
    .map((userId) => ({
      sweepstake_id: sweepstakeId,
      user_id: userId,
      role: "admin" as const,
      invited_email: null,
    }));

  const invited = (input.invitedAdminEmails ?? []).map((email) => ({
    sweepstake_id: sweepstakeId,
    user_id: null,
    role: "admin" as const,
    invited_email: email.trim().toLowerCase(),
  }));

  return [owner, ...admins, ...invited];
}

export function buildParticipantInserts(
  sweepstakeId: string,
  participants: ParticipantDraft[],
) {
  return participants.map((participant, index) => ({
    sweepstake_id: sweepstakeId,
    display_name: participant.displayName.trim(),
    sort_order: index,
  }));
}

export function buildParticipantEmailInserts(
  participantRows: Array<{ id: string; display_name: string }>,
  participantDrafts: ParticipantDraft[],
) {
  return participantRows.flatMap((participantRow) => {
    const draft = participantDrafts.find(
      (participant) =>
        participant.displayName.trim() === participantRow.display_name,
    );

    if (!draft?.email?.trim()) {
      return [];
    }

    return {
      participant_id: participantRow.id,
      email: draft.email.trim().toLowerCase(),
      update_opt_in: true,
    };
  });
}

export function buildBadgeCategoryInserts(
  sweepstakeId: string,
  badgeCategories: BadgeCategoryDraft[],
) {
  return badgeCategories.map((badgeCategory, index) => ({
    sweepstake_id: sweepstakeId,
    key: badgeCategory.key,
    label: badgeCategory.label,
    status: badgeCategory.status ?? "active",
    sort_order: badgeCategory.sortOrder ?? index,
    is_enabled: badgeCategory.isEnabled ?? true,
  }));
}

export async function persistSweepstakeSetup(
  supabase: SupabaseClient,
  input: PersistSweepstakeSetupInput,
) {
  const { data: sweepstake, error: sweepstakeError } = await supabase
    .from("sweepstakes")
    .insert(buildSweepstakeInsert(input))
    .select("id, share_token")
    .single();

  if (sweepstakeError) {
    throw sweepstakeError;
  }

  const { error: adminError } = await supabase
    .from("sweepstake_admins")
    .insert(buildAdminInserts(sweepstake.id, input));

  if (adminError) {
    throw adminError;
  }

  const { data: participantRows, error: participantError } = await supabase
    .from("participants")
    .insert(buildParticipantInserts(sweepstake.id, input.participants))
    .select("id, display_name");

  if (participantError) {
    throw participantError;
  }

  const participantEmails = buildParticipantEmailInserts(
    participantRows ?? [],
    input.participants,
  );

  if (participantEmails.length > 0) {
    const { error: emailError } = await supabase
      .from("participant_emails")
      .insert(participantEmails);

    if (emailError) {
      throw emailError;
    }
  }

  const { error: badgeError } = await supabase
    .from("badge_categories")
    .insert(buildBadgeCategoryInserts(sweepstake.id, input.badgeCategories));

  if (badgeError) {
    throw badgeError;
  }

  return sweepstake;
}

function createShareToken() {
  return randomBytes(24).toString("base64url");
}
