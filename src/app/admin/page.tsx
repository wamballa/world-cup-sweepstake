import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { AppShell, type AccountSweepstake } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const sweepstakes = await loadAdminSweepstakes(user.id);

  return (
    <AppShell
      admin={{
        displayName: getDisplayName(user.user_metadata.name, user.email),
        email: user.email ?? "Signed-in admin",
      }}
      initialSweepstakes={sweepstakes}
      shareOrigin={await getShareOrigin()}
    />
  );
}

async function getShareOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (configuredUrl) {
    return normalizeOrigin(configuredUrl);
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    const vercelUrl =
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

    return vercelUrl ? normalizeOrigin(vercelUrl) : "";
  }

  return `${protocol}://${host}`;
}

function normalizeOrigin(url: string) {
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return new URL(withProtocol).origin;
}

function getDisplayName(name: unknown, email: string | undefined) {
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (email) {
    return email.split("@")[0];
  }

  return "Admin";
}

async function loadAdminSweepstakes(userId: string): Promise<AccountSweepstake[]> {
  const supabase = await createSupabaseServerClient();
  const { data: sweepstakes, error: sweepstakesError } = await supabase
    .from("sweepstakes")
    .select("id, name, share_token, status, created_at")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (sweepstakesError) {
    throw sweepstakesError;
  }

  const sweepstakeIds = (sweepstakes ?? []).map((sweepstake) => sweepstake.id);

  if (sweepstakeIds.length === 0) {
    return [];
  }

  const [
    { data: participantRows, error: participantError },
    { data: adminRows, error: adminError },
    { data: allocationRows, error: allocationError },
    { data: auditRows, error: auditError },
    { data: teamRows, error: teamError },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("id, sweepstake_id, display_name, sort_order")
      .in("sweepstake_id", sweepstakeIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("sweepstake_admins")
      .select("sweepstake_id, invited_email, user_id, role")
      .in("sweepstake_id", sweepstakeIds),
    supabase
      .from("team_allocations")
      .select("sweepstake_id, participant_id, team_id")
      .in("sweepstake_id", sweepstakeIds),
    supabase
      .from("allocation_audit_events")
      .select("id, sweepstake_id, action, actor_user_id, created_at, note")
      .in("sweepstake_id", sweepstakeIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("teams")
      .select("id, name, short_name, group_name")
      .eq("tournament_code", "WC_2026")
      .order("name", { ascending: true }),
  ]);

  if (participantError) {
    throw participantError;
  }

  if (adminError) {
    throw adminError;
  }

  if (allocationError) {
    throw allocationError;
  }

  if (auditError) {
    throw auditError;
  }

  if (teamError) {
    throw teamError;
  }

  const participantIds = (participantRows ?? []).map(
    (participant) => participant.id,
  );
  const { data: emailRows, error: emailError } =
    participantIds.length > 0
      ? await supabase
          .from("participant_emails")
          .select("participant_id, email")
          .in("participant_id", participantIds)
      : { data: [], error: null };

  if (emailError) {
    throw emailError;
  }

  return (sweepstakes ?? []).map((sweepstake) => {
    const participants = (participantRows ?? [])
      .filter((participant) => participant.sweepstake_id === sweepstake.id)
      .map((participant) => ({
        id: participant.id,
        name: participant.display_name,
        email:
          (emailRows ?? []).find(
            (email) => email.participant_id === participant.id,
          )?.email ?? "",
      }));

    const adminEmails = (adminRows ?? [])
      .filter(
        (admin) =>
          admin.sweepstake_id === sweepstake.id && admin.invited_email,
      )
      .map((admin) => admin.invited_email)
      .join("\n");

    return {
      id: sweepstake.id,
      name: sweepstake.name,
      shareToken: sweepstake.share_token,
      isOwner: (adminRows ?? []).some(
        (admin) =>
          admin.sweepstake_id === sweepstake.id &&
          admin.user_id === userId &&
          admin.role === "owner",
      ),
      participants,
      adminEmails,
      teams: (teamRows ?? []).map((team) => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name ?? createShortTeamName(team.name),
        groupName: team.group_name,
      })),
      allocations: (allocationRows ?? [])
        .filter((allocation) => allocation.sweepstake_id === sweepstake.id)
        .map((allocation) => ({
          participantId: allocation.participant_id,
          teamId: allocation.team_id,
        })),
      auditEvents: (auditRows ?? [])
        .filter((event) => event.sweepstake_id === sweepstake.id)
        .map((event) => ({
          id: event.id,
          action: toUiAllocationAction(event.action),
          actor: event.actor_user_id ?? "Admin",
          createdAt: event.created_at,
          note: event.note,
        })),
    };
  });
}

function createShortTeamName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function toUiAllocationAction(action: string) {
  if (action === "initial_draw") {
    return "initial-draw" as const;
  }

  if (action === "manual_move") {
    return "manual-move" as const;
  }

  return "rerun" as const;
}
