import { describe, expect, it } from "vitest";

import {
  buildAdminInserts,
  buildBadgeCategoryInserts,
  buildParticipantEmailInserts,
  buildParticipantInserts,
  buildSweepstakeInsert,
  type PersistSweepstakeSetupInput,
} from "./sweepstakes";

const setupInput: PersistSweepstakeSetupInput = {
  name: " Friday Office Draw ",
  createdBy: "user-owner",
  adminUserIds: ["user-owner", "user-admin"],
  invitedAdminEmails: ["OPS@Example.com"],
  participants: [
    { displayName: " Maya ", email: "MAYA@Example.com " },
    { displayName: "Theo" },
  ],
  badgeCategories: [
    { key: "first-place", label: "1st Place" },
    {
      key: "most-cards",
      label: "Most Cards",
      status: "manual_future",
      isEnabled: false,
    },
  ],
};

describe("Supabase sweepstake persistence builders", () => {
  it("builds the sweepstake row without storing non-database input", () => {
    expect(buildSweepstakeInsert(setupInput)).toEqual({
      name: "Friday Office Draw",
      tournament_code: "WC_2026",
      status: "draft",
      share_token: expect.any(String),
      created_by: "user-owner",
    });
    expect(buildSweepstakeInsert(setupInput).share_token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("separates owner, confirmed admins, and pending invited admins", () => {
    expect(buildAdminInserts("sweepstake-1", setupInput)).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        user_id: "user-owner",
        role: "owner",
        invited_email: null,
      },
      {
        sweepstake_id: "sweepstake-1",
        user_id: "user-admin",
        role: "admin",
        invited_email: null,
      },
      {
        sweepstake_id: "sweepstake-1",
        user_id: null,
        role: "admin",
        invited_email: "ops@example.com",
      },
    ]);
  });

  it("stores participant emails separately from participant display rows", () => {
    const participantInserts = buildParticipantInserts(
      "sweepstake-1",
      setupInput.participants,
    );

    expect(participantInserts).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        display_name: "Maya",
        sort_order: 0,
      },
      {
        sweepstake_id: "sweepstake-1",
        display_name: "Theo",
        sort_order: 1,
      },
    ]);

    expect(
      buildParticipantEmailInserts(
        [{ id: "participant-1", display_name: "Maya" }],
        setupInput.participants,
      ),
    ).toEqual([
      {
        participant_id: "participant-1",
        email: "maya@example.com",
        update_opt_in: true,
      },
    ]);
  });

  it("builds badge categories with manual future support", () => {
    expect(buildBadgeCategoryInserts("sweepstake-1", setupInput.badgeCategories)).toEqual([
      {
        sweepstake_id: "sweepstake-1",
        key: "first-place",
        label: "1st Place",
        status: "active",
        sort_order: 0,
        is_enabled: true,
      },
      {
        sweepstake_id: "sweepstake-1",
        key: "most-cards",
        label: "Most Cards",
        status: "manual_future",
        sort_order: 1,
        is_enabled: false,
      },
    ]);
  });
});
