import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { AppShell, type AccountSweepstake } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFootballDataTournamentByCode } from "@/features/tournaments/world-cup";

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
    .select("id, name, share_token, status, tournament_code, created_at")
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
    viewModeResult,
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
      .select("id, tournament_code, name, short_name, group_name")
      .in(
        "tournament_code",
        [...new Set((sweepstakes ?? []).map((sweepstake) => sweepstake.tournament_code))],
      )
      .order("name", { ascending: true }),
    loadSharedViewModes(supabase, sweepstakeIds),
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

  const viewModes = new Map(
    (viewModeResult.data ?? []).map((row) => [
      String(row.id),
      row.shared_view_mode === "countdown"
        ? ("countdown" as const)
        : ("participant_board" as const),
    ]),
  );

  return (sweepstakes ?? []).map((sweepstake) => {
    const tournament = getFootballDataTournamentByCode(sweepstake.tournament_code);
    const teams = (teamRows ?? [])
      .filter((team) => team.tournament_code === tournament.code)
      .map((team) => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name ?? createShortTeamName(team.name),
        groupName: team.group_name,
      }));
    const validTeamIds = new Set(teams.map((team) => team.id));
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
      tournamentCode: tournament.code,
      tournamentLabel: tournament.label,
      sharedViewMode: viewModes.get(sweepstake.id) ?? "participant_board",
      isOwner: (adminRows ?? []).some(
        (admin) =>
          admin.sweepstake_id === sweepstake.id &&
          admin.user_id === userId &&
          admin.role === "owner",
      ),
      participants,
      adminEmails,
      teams,
      allocations: (allocationRows ?? [])
        .filter((allocation) => allocation.sweepstake_id === sweepstake.id)
        .filter((allocation) => validTeamIds.has(allocation.team_id))
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

async function loadSharedViewModes(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sweepstakeIds: string[],
): Promise<{
  data: Array<{ id: string; shared_view_mode: string | null }>;
}> {
  const { data, error } = await supabase
    .from("sweepstakes")
    .select("id, shared_view_mode")
    .in("id", sweepstakeIds);

  if (error && error.message.includes("shared_view_mode")) {
    return { data: [] };
  }

  if (error) {
    throw error;
  }

  return { data: data ?? [] };
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
