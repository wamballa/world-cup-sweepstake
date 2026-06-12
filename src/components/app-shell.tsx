"use client";

import {
  Archive,
  BadgeCheck,
  BarChart3,
  Check,
  Clipboard,
  Clock3,
  Copy,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createAllocationAudit,
  createFairAllocation,
  getAllocationSpread,
  moveAllocatedTeam,
  type AllocationAudit,
  type TeamAllocation,
} from "@/features/allocation/fair-allocation";
import {
  archiveOwnedSweepstake,
  changeSweepstakeTournament,
  createSweepstakeParticipant,
  createSweepstakeParticipantsBulk,
  createOwnedSweepstake,
  deleteSweepstakeParticipant,
  saveSweepstakeAllocation,
  saveSweepstakeSharedViewMode,
  saveSweepstakeSettings,
  updateSweepstakeParticipant,
} from "@/app/admin/actions";
import {
  getDuplicateBulkParticipantNames,
  parseBulkParticipantNames,
} from "@/features/participants/bulk-participant-parser";
import { footballDataTournaments } from "@/features/tournaments/world-cup";
import { SyncDiagnosticsPanel } from "@/features/admin/sync-diagnostics-panel";
import type {
  SyncDiagnostics,
} from "@/features/admin/sync-diagnostics-types";
import { AllocationSection } from "@/features/sweepstake-demo/allocation-section";
import {
  createPreviewShareToken,
  formatParticipantCapacity,
  getDuplicateNames,
  getLocalTeamName,
  getParticipantName,
  getProjectedSpread,
} from "@/features/sweepstake-demo/demo-helpers";
import { Metric, StatusRow } from "@/features/sweepstake-demo/demo-primitives";
import type { DrawTeam, ParticipantDraft } from "@/features/sweepstake-demo/types";

const automatedBadges = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "4th Place",
  "Wooden Spoon",
  "First Knocked Out",
  "Most Goals Conceded",
  "Fewest Goals Scored",
];

const manualFutureBadges = [
  "Most Cards",
  "Golden Boot Team",
  "Golden Glove Team",
];

type AdminScreen = "dashboard" | "setup" | "sweepstake";
type AdminTab = "overview" | "participants" | "draw" | "settings";
type SharedViewMode = "participant_board" | "countdown";

type AdminIdentity = {
  displayName: string;
  email: string;
};

export type AccountSweepstake = {
  id: string;
  name: string;
  shareToken: string;
  tournamentCode: string;
  tournamentLabel: string;
  sharedViewMode: SharedViewMode;
  isOwner: boolean;
  participants: ParticipantDraft[];
  adminEmails: string;
  teams: DrawTeam[];
  allocations: TeamAllocation[];
  auditEvents: AllocationAudit[];
};

export function AppShell({
  admin,
  initialSweepstakes,
  shareOrigin,
  syncDiagnostics,
}: {
  admin: AdminIdentity;
  initialSweepstakes: AccountSweepstake[];
  shareOrigin: string;
  syncDiagnostics: Record<string, SyncDiagnostics>;
}) {
  const [screen, setScreen] = useState<AdminScreen>("dashboard");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sweepstakes, setSweepstakes] = useState(initialSweepstakes);
  const [activeSweepstakeId, setActiveSweepstakeId] = useState(
    initialSweepstakes[0]?.id ?? "",
  );
  const activeSweepstake =
    sweepstakes.find((sweepstake) => sweepstake.id === activeSweepstakeId) ??
    sweepstakes[0] ??
    null;
  const [sweepstakeName, setSweepstakeName] = useState(
    activeSweepstake?.name ?? "",
  );
  const [setupName, setSetupName] = useState("");
  const [participants, setParticipants] = useState<ParticipantDraft[]>(
    activeSweepstake?.participants ?? [],
  );
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [bulkParticipantText, setBulkParticipantText] = useState("");
  const [adminEmails, setAdminEmails] = useState(
    activeSweepstake?.adminEmails ?? "",
  );
  const [allocations, setAllocations] = useState<TeamAllocation[]>(
    activeSweepstake?.allocations ?? [],
  );
  const [auditEvents, setAuditEvents] = useState<AllocationAudit[]>(
    activeSweepstake?.auditEvents ?? [],
  );
  const [sharedViewMode, setSharedViewMode] = useState<SharedViewMode>(
    activeSweepstake?.sharedViewMode ?? "participant_board",
  );
  const [moveTeamId, setMoveTeamId] = useState(
    activeSweepstake?.teams[0]?.id ?? "",
  );
  const [moveParticipantId, setMoveParticipantId] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const teams = activeSweepstake?.teams ?? [];

  const duplicateNames = useMemo(
    () => getDuplicateNames(participants),
    [participants],
  );
  const participantIds = participants.map((participant) => participant.id);
  const spread =
    allocations.length > 0 && participants.length > 0
      ? getAllocationSpread(participantIds, allocations)
      : getProjectedSpread(participants.length, teams.length);
  const shareToken = activeSweepstake?.shareToken ?? createPreviewShareToken();
  const sharePath = `/s/${shareToken}`;
  const shareLink = shareOrigin
    ? new URL(sharePath, shareOrigin).toString()
    : sharePath;
  const canAllocate =
    sweepstakeName.trim().length > 0 &&
    participants.length > 0 &&
    teams.length > 0 &&
    duplicateNames.length === 0;
  const emailCount = participants.filter((participant) => participant.email).length;

  function openSweepstake(tab: AdminTab = "overview") {
    setActiveTab(tab);
    setScreen("sweepstake");
  }

  function loadSweepstake(sweepstake: AccountSweepstake, tab: AdminTab = "overview") {
    setActiveSweepstakeId(sweepstake.id);
    setSweepstakeName(sweepstake.name);
    setParticipants(sweepstake.participants);
    setBulkParticipantText("");
    setAdminEmails(sweepstake.adminEmails);
    setAllocations(sweepstake.allocations);
    setAuditEvents(sweepstake.auditEvents);
    setSharedViewMode(sweepstake.sharedViewMode);
    setMoveTeamId(sweepstake.allocations[0]?.teamId ?? sweepstake.teams[0]?.id ?? "");
    setMoveParticipantId(
      sweepstake.allocations[0]?.participantId ??
        sweepstake.participants[0]?.id ??
        "",
    );
    setSaveStatus("");
    setActiveTab(tab);
    setScreen("sweepstake");
  }

  async function createSweepstakeFromSetup() {
    const nextName = setupName.trim();

    if (!nextName) {
      return;
    }

    setSaveStatus("Creating sweepstake...");
    const createdSweepstake = await createOwnedSweepstake(nextName);

    setSweepstakes((current) => [createdSweepstake, ...current]);
    setActiveSweepstakeId(createdSweepstake.id);
    setSweepstakeName(createdSweepstake.name);
    setParticipants([]);
    setBulkParticipantText("");
    setAdminEmails("");
    setSetupName("");
    setAllocations([]);
    setAuditEvents([]);
    setSharedViewMode(createdSweepstake.sharedViewMode);
    setMoveTeamId(createdSweepstake.teams[0]?.id ?? "");
    setMoveParticipantId("");
    setSaveStatus("Sweepstake saved to your account.");
    openSweepstake("participants");
  }

  async function changeTournamentYear(tournamentCode: string) {
    if (!activeSweepstake || tournamentCode === activeSweepstake.tournamentCode) {
      return;
    }

    setSaveStatus("Changing tournament dataset and resetting the draw...");

    try {
      const result = await changeSweepstakeTournament({
        sweepstakeId: activeSweepstake.id,
        tournamentCode,
      });

      if (
        !result.ok ||
        !result.tournamentCode ||
        !result.tournamentLabel ||
        !result.teams
      ) {
        setSaveStatus(result.message);
        return;
      }

      const changedTournamentCode = result.tournamentCode;
      const changedTournamentLabel = result.tournamentLabel;
      const changedTeams = result.teams;
      const note = `Tournament changed to ${changedTournamentLabel}. Existing draw and derived results were reset.`;
      const resetAudit = createAllocationAudit("rerun", note);

      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? {
                ...sweepstake,
                tournamentCode: changedTournamentCode,
                tournamentLabel: changedTournamentLabel,
                teams: changedTeams,
                allocations: [],
                auditEvents: [resetAudit, ...sweepstake.auditEvents],
              }
            : sweepstake,
        ),
      );
      setAllocations([]);
      setAuditEvents((current) => [resetAudit, ...current]);
      setMoveTeamId(changedTeams[0]?.id ?? "");
      setMoveParticipantId(participants[0]?.id ?? "");
      setActiveTab("draw");
      setSaveStatus(
        result.message
          ? `${note} ${result.message}`
          : `${note} Run a new draw when ready.`,
      );
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function addParticipant() {
    const nextName = participantName.trim();

    if (!nextName || !activeSweepstake) {
      return;
    }

    setSaveStatus("Saving participant...");

    try {
      const savedParticipant = await createSweepstakeParticipant({
        sweepstakeId: activeSweepstake.id,
        name: nextName,
        email: participantEmail,
      });

      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? {
                ...sweepstake,
                participants: [...sweepstake.participants, savedParticipant],
              }
            : sweepstake,
        ),
      );
      setParticipants((current) => [...current, savedParticipant]);
      setMoveParticipantId((current) => current || savedParticipant.id);
      setParticipantName("");
      setParticipantEmail("");
      setSaveStatus(
        "Participant added. Existing allocations were kept. Use manual moves or rerun only if you want to change the draw.",
      );
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function addBulkParticipants() {
    const names = parseBulkParticipantNames(bulkParticipantText);

    if (names.length === 0 || !activeSweepstake) {
      return;
    }

    setSaveStatus("Saving participants...");

    try {
      const savedParticipants = await createSweepstakeParticipantsBulk({
        sweepstakeId: activeSweepstake.id,
        names,
      });

      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? {
                ...sweepstake,
                participants: [...sweepstake.participants, ...savedParticipants],
              }
            : sweepstake,
        ),
      );
      setParticipants((current) => [...current, ...savedParticipants]);
      setMoveParticipantId(
        (current) => current || (savedParticipants[0]?.id ?? ""),
      );
      setBulkParticipantText("");
      setSaveStatus(
        `${savedParticipants.length} participants added. Existing allocations were kept.`,
      );
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  function updateParticipant(
    participantId: string,
    field: "name" | "email",
    value: string,
  ) {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === participantId
          ? { ...participant, [field]: value }
          : participant,
      ),
    );
  }

  async function deleteParticipant(participantId: string) {
    if (!activeSweepstake) {
      return;
    }

    setSaveStatus("Deleting participant...");

    try {
      await deleteSweepstakeParticipant({
        sweepstakeId: activeSweepstake.id,
        participantId,
      });

      const nextParticipants = participants.filter(
        (participant) => participant.id !== participantId,
      );
      const nextAllocations = allocations.filter(
        (allocation) => allocation.participantId !== participantId,
      );

      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? {
                ...sweepstake,
                participants: nextParticipants,
                allocations: nextAllocations,
              }
            : sweepstake,
        ),
      );
      setParticipants(nextParticipants);
      setAllocations(nextAllocations);
      setMoveParticipantId((current) =>
        current === participantId ? nextParticipants[0]?.id ?? "" : current,
      );
      setSaveStatus(
        "Participant deleted. Existing allocations for everyone else were kept.",
      );
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function runAllocation(action: "initial-draw" | "rerun") {
    if (!canAllocate) {
      return;
    }

    if (!activeSweepstake) {
      return;
    }

    setSaveStatus("Saving allocation...");

    try {
      const nextAllocations = createFairAllocation(participants, teams);
      const note = `${teams.length} teams allocated across ${participants.length} participants.`;

      await saveSweepstakeAllocation({
        sweepstakeId: activeSweepstake.id,
        action,
        note,
        allocations: nextAllocations,
      });

      setAllocations(nextAllocations);
      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? { ...sweepstake, allocations: nextAllocations }
            : sweepstake,
        ),
      );
      setMoveTeamId(nextAllocations[0]?.teamId ?? teams[0]?.id ?? "");
      setMoveParticipantId(nextAllocations[0]?.participantId ?? participants[0]?.id ?? "");
      setAuditEvents((current) => [
        createAllocationAudit(
          action,
          note,
        ),
        ...current,
      ]);
      setSaveStatus(note);
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function applyManualMove() {
    if (!moveTeamId || !moveParticipantId) {
      return;
    }

    if (!activeSweepstake) {
      return;
    }

    const nextAllocations = moveAllocatedTeam(
      allocations,
      moveTeamId,
      moveParticipantId,
    );
    const note = `${getLocalTeamName(moveTeamId, teams)} moved to ${getParticipantName(
      moveParticipantId,
      participants,
    )}.`;

    setSaveStatus("Saving manual move...");

    try {
      await saveSweepstakeAllocation({
        sweepstakeId: activeSweepstake.id,
        action: "manual-move",
        note,
        allocations: nextAllocations,
      });

      setAllocations(nextAllocations);
      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? { ...sweepstake, allocations: nextAllocations }
            : sweepstake,
        ),
      );
      setAuditEvents((current) => [
        createAllocationAudit("manual-move", note),
        ...current,
      ]);
      setSaveStatus(note);
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function copyShareLink() {
    setShareCopied(true);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareLink);
    }

    window.setTimeout(() => setShareCopied(false), 1600);
  }

  async function changeSharedViewMode(nextMode: SharedViewMode) {
    if (!activeSweepstake || nextMode === sharedViewMode) {
      return;
    }

    setSaveStatus("Updating shared link display...");

    try {
      await saveSweepstakeSharedViewMode({
        sweepstakeId: activeSweepstake.id,
        sharedViewMode: nextMode,
      });
      setSharedViewMode(nextMode);
      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? { ...sweepstake, sharedViewMode: nextMode }
            : sweepstake,
        ),
      );
      setSaveStatus(
        nextMode === "countdown"
          ? "Shared link now opens the countdown page."
          : "Shared link now opens the participant board.",
      );
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function saveParticipantEdit(
    participantId: string,
    field: "name" | "email",
    value: string,
  ) {
    if (!activeSweepstake) {
      return;
    }

    const participant = participants.find((person) => person.id === participantId);

    if (!participant) {
      return;
    }

    const nextParticipant = { ...participant, [field]: value };

    setSaveStatus("Saving participant...");

    try {
      const savedParticipant = await updateSweepstakeParticipant({
        sweepstakeId: activeSweepstake.id,
        participantId,
        name: nextParticipant.name,
        email: nextParticipant.email,
      });

      setSweepstakes((current) =>
        current.map((sweepstake) =>
          sweepstake.id === activeSweepstake.id
            ? {
                ...sweepstake,
                participants: sweepstake.participants.map((person) =>
                  person.id === participantId ? savedParticipant : person,
                ),
              }
            : sweepstake,
        ),
      );
      setParticipants((current) =>
        current.map((person) =>
          person.id === participantId ? savedParticipant : person,
        ),
      );
      setSaveStatus(
        "Participant updated. Existing allocations were kept. Use manual moves or rerun only if you want to change the draw.",
      );
    } catch (error) {
      setSaveStatus(getActionErrorMessage(error));
    }
  }

  async function saveSettingsToAccount() {
    if (!activeSweepstake) {
      return;
    }

    setSaveStatus("Saving settings...");
    await saveSweepstakeSettings({
      sweepstakeId: activeSweepstake.id,
      name: sweepstakeName,
      invitedAdminEmails: adminEmails.split(/\r?\n/),
    });
    setSweepstakes((current) =>
      current.map((sweepstake) =>
        sweepstake.id === activeSweepstake.id
          ? { ...sweepstake, name: sweepstakeName, adminEmails }
          : sweepstake,
      ),
    );
    setSaveStatus("Settings saved to your account.");
  }

  async function archiveSweepstakeFromAccount() {
    if (!activeSweepstake || !activeSweepstake.isOwner) {
      return;
    }

    setSaveStatus("Archiving sweepstake...");
    await archiveOwnedSweepstake(activeSweepstake.id);

    const remainingSweepstakes = sweepstakes.filter(
      (sweepstake) => sweepstake.id !== activeSweepstake.id,
    );

    setSweepstakes(remainingSweepstakes);

    if (remainingSweepstakes.length > 0) {
      loadSweepstake(remainingSweepstakes[0]);
      setScreen("dashboard");
      setSaveStatus("Sweepstake archived. Its shared link is now inactive.");
      return;
    }

    setActiveSweepstakeId("");
    setSweepstakeName("");
    setParticipants([]);
    setBulkParticipantText("");
    setAdminEmails("");
    setAllocations([]);
    setAuditEvents([]);
    setSharedViewMode("participant_board");
    setMoveTeamId("");
    setMoveParticipantId("");
    setSaveStatus("Sweepstake archived. Its shared link is now inactive.");
    setScreen("dashboard");
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col md:flex-row">
        <AdminSidebar
          activeScreen={screen}
          admin={admin}
          sweepstakeName={sweepstakeName}
          sweepstakes={sweepstakes}
          onDashboard={() => setScreen("dashboard")}
          onNewSweepstake={() => setScreen("setup")}
          onOpenSweepstake={(sweepstake) => loadSweepstake(sweepstake)}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <MobileHeader
            admin={admin}
            onDashboard={() => setScreen("dashboard")}
            onNewSweepstake={() => setScreen("setup")}
          />

          <div className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
            {screen === "dashboard" ? (
              <AdminDashboard
                participantCount={participants.length}
                sweepstakes={sweepstakes}
                onNewSweepstake={() => setScreen("setup")}
                onOpenSweepstake={(sweepstake) => loadSweepstake(sweepstake)}
              />
            ) : null}

            {screen === "setup" ? (
              <NewSweepstakeFlow
                setupName={setupName}
                onCancel={() => setScreen("dashboard")}
                onCreate={createSweepstakeFromSetup}
                onSetupNameChange={setSetupName}
              />
            ) : null}

            {screen === "sweepstake" ? (
              <SweepstakeAdminTabs
                activeTab={activeTab}
                adminEmails={adminEmails}
                allocations={allocations}
                auditEvents={auditEvents}
                canAllocate={canAllocate}
                duplicateNames={duplicateNames}
                emailCount={emailCount}
                hasUnsavedParticipants={false}
                moveParticipantId={moveParticipantId}
                moveTeamId={moveTeamId}
                bulkParticipantText={bulkParticipantText}
                participantEmail={participantEmail}
                participantName={participantName}
                participants={participants}
                shareCopied={shareCopied}
                shareLink={shareLink}
                sharedViewMode={sharedViewMode}
                isOwner={activeSweepstake?.isOwner ?? false}
                saveStatus={saveStatus}
                spread={spread}
                sweepstakeName={sweepstakeName}
                tournamentCode={activeSweepstake?.tournamentCode ?? "WC_2026"}
                syncDiagnostics={
                  syncDiagnostics[
                    activeSweepstake?.tournamentCode ?? "WC_2026"
                  ] ?? null
                }
                teams={teams}
                onActiveTabChange={setActiveTab}
                onAddParticipant={addParticipant}
                onAddBulkParticipants={addBulkParticipants}
                onAdminEmailsChange={setAdminEmails}
                onApplyManualMove={applyManualMove}
                onCopyShareLink={copyShareLink}
                onSharedViewModeChange={changeSharedViewMode}
                onArchiveSweepstake={archiveSweepstakeFromAccount}
                onMoveParticipantChange={setMoveParticipantId}
                onMoveTeamChange={setMoveTeamId}
                onBulkParticipantTextChange={setBulkParticipantText}
                onDeleteParticipant={deleteParticipant}
                onParticipantChange={updateParticipant}
                onParticipantEmailDraftChange={setParticipantEmail}
                onParticipantNameDraftChange={setParticipantName}
                onSaveParticipantEdit={saveParticipantEdit}
                onRunAllocation={runAllocation}
                onSaveSettings={saveSettingsToAccount}
                onSweepstakeNameChange={setSweepstakeName}
                onTournamentChange={changeTournamentYear}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminSidebar({
  activeScreen,
  admin,
  sweepstakeName,
  sweepstakes,
  onDashboard,
  onNewSweepstake,
  onOpenSweepstake,
}: {
  activeScreen: AdminScreen;
  admin: AdminIdentity;
  sweepstakeName: string;
  sweepstakes: AccountSweepstake[];
  onDashboard: () => void;
  onNewSweepstake: () => void;
  onOpenSweepstake: (sweepstake: AccountSweepstake) => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-surface-muted/70 p-4 md:flex md:min-h-dvh md:flex-col">
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Trophy className="size-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">Drawdeck</p>
          <p className="text-xs text-muted-foreground">World Cup sweepstakes</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2" aria-label="Admin navigation">
        <Button
          className="w-full justify-start"
          variant={activeScreen === "dashboard" ? "secondary" : "ghost"}
          onClick={onDashboard}
        >
          <LayoutDashboard className="size-4" aria-hidden="true" />
          My sweepstakes
        </Button>
        <Button
          className="w-full justify-start"
          variant={activeScreen === "setup" ? "secondary" : "ghost"}
          onClick={onNewSweepstake}
        >
          <Plus className="size-4" aria-hidden="true" />
          New sweepstake
        </Button>
      </nav>

      <div className="mt-8">
        <p className="px-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Active sweepstakes
        </p>
        <div className="mt-2 space-y-1">
          {sweepstakes.length > 0 ? (
            sweepstakes.map((sweepstake) => (
              <Button
                key={sweepstake.id}
                className="w-full justify-start truncate"
                variant={
                  activeScreen === "sweepstake" &&
                  sweepstake.name === sweepstakeName
                    ? "secondary"
                    : "ghost"
                }
                onClick={() => onOpenSweepstake(sweepstake)}
              >
                <Trophy className="size-4" aria-hidden="true" />
                {sweepstake.name}
              </Button>
            ))
          ) : (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              No sweepstakes yet
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t pt-4 text-sm text-muted-foreground">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {admin.displayName}
          </p>
          <p className="truncate">{admin.email}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

function MobileHeader({
  admin,
  onDashboard,
  onNewSweepstake,
}: {
  admin: AdminIdentity;
  onDashboard: () => void;
  onNewSweepstake: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/92 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <button
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={onDashboard}
          type="button"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Drawdeck</p>
            <p className="truncate text-xs text-muted-foreground">
              {admin.email}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={onNewSweepstake}>
            <Plus className="size-3.5" aria-hidden="true" />
            New
          </Button>
          <LogoutButton compact />
        </div>
      </div>
    </header>
  );
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/logout" method="post">
      <Button
        aria-label="Log out"
        className={compact ? "px-2 sm:px-3" : "w-full justify-start"}
        size={compact ? "sm" : "default"}
        type="submit"
        variant={compact ? "outline" : "ghost"}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {compact ? <span className="hidden sm:inline">Log out</span> : "Log out"}
      </Button>
    </form>
  );
}

function AdminDashboard({
  participantCount,
  sweepstakes,
  onNewSweepstake,
  onOpenSweepstake,
}: {
  participantCount: number;
  sweepstakes: AccountSweepstake[];
  onNewSweepstake: () => void;
  onOpenSweepstake: (sweepstake: AccountSweepstake) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Admin dashboard</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            My sweepstakes
          </h1>
        </div>
        <Button onClick={onNewSweepstake}>
          <Plus className="size-4" aria-hidden="true" />
          New sweepstake
        </Button>
      </div>

      {sweepstakes.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {sweepstakes.map((sweepstake) => (
            <SweepstakeListCard
              key={sweepstake.id}
              badge="Account"
              body={`${sweepstake.participants.length || participantCount} participants saved to this account.`}
              name={sweepstake.name}
              onOpen={() => onOpenSweepstake(sweepstake)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No account sweepstakes yet</CardTitle>
            <CardDescription>
              Create your first sweepstake and it will be stored against your
              signed-in admin account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNewSweepstake}>
              <Plus className="size-4" aria-hidden="true" />
              New sweepstake
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SweepstakeListCard({
  badge,
  body,
  name,
  onOpen,
}: {
  badge: string;
  body: string;
  name: string;
  onOpen: () => void;
}) {
  return (
    <button
      className="rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition hover:ring-primary/40"
      onClick={onOpen}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        <Badge variant="secondary">{badge}</Badge>
      </div>
    </button>
  );
}

function NewSweepstakeFlow({
  setupName,
  onCancel,
  onCreate,
  onSetupNameChange,
}: {
  setupName: string;
  onCancel: () => void;
  onCreate: () => void;
  onSetupNameChange: (value: string) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-3">
        <div className="h-1.5 w-44 rounded-full bg-secondary">
          <div className="h-full w-1/4 rounded-full bg-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Step 1 of 4</p>
        <Badge variant="secondary">FIFA World Cup 2026</Badge>
        <h1 className="text-3xl font-semibold tracking-normal">
          Name your sweepstake
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Start with the group name. Participants, emails, badges, and draw
          settings stay editable after creation.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-sweepstake-name">Sweepstake name</Label>
            <Input
              id="new-sweepstake-name"
              autoFocus
              value={setupName}
              onChange={(event) => onSetupNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onCreate();
                }
              }}
              placeholder="Office World Cup 2026"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            No participant names needed yet. Add people manually or paste a
            list from the Participants tab.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!setupName.trim()} onClick={onCreate}>
              Create sweepstake
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SweepstakeAdminTabs({
  activeTab,
  adminEmails,
  allocations,
  auditEvents,
  canAllocate,
  duplicateNames,
  emailCount,
  hasUnsavedParticipants,
  moveParticipantId,
  moveTeamId,
  bulkParticipantText,
  participantEmail,
  participantName,
  participants,
  shareCopied,
  shareLink,
  sharedViewMode,
  isOwner,
  saveStatus,
  spread,
  sweepstakeName,
  tournamentCode,
  syncDiagnostics,
  teams,
  onActiveTabChange,
  onAddParticipant,
  onAddBulkParticipants,
  onAdminEmailsChange,
  onApplyManualMove,
  onArchiveSweepstake,
  onBulkParticipantTextChange,
  onCopyShareLink,
  onSharedViewModeChange,
  onDeleteParticipant,
  onMoveParticipantChange,
  onMoveTeamChange,
  onParticipantChange,
  onParticipantEmailDraftChange,
  onParticipantNameDraftChange,
  onSaveParticipantEdit,
  onRunAllocation,
  onSaveSettings,
  onSweepstakeNameChange,
  onTournamentChange,
}: {
  activeTab: AdminTab;
  adminEmails: string;
  allocations: TeamAllocation[];
  auditEvents: AllocationAudit[];
  canAllocate: boolean;
  duplicateNames: string[];
  emailCount: number;
  hasUnsavedParticipants: boolean;
  moveParticipantId: string;
  moveTeamId: string;
  bulkParticipantText: string;
  participantEmail: string;
  participantName: string;
  participants: ParticipantDraft[];
  shareCopied: boolean;
  shareLink: string;
  sharedViewMode: SharedViewMode;
  isOwner: boolean;
  saveStatus: string;
  spread: { min: number; max: number };
  sweepstakeName: string;
  tournamentCode: string;
  syncDiagnostics: SyncDiagnostics | null;
  teams: DrawTeam[];
  onActiveTabChange: (value: AdminTab) => void;
  onAddParticipant: () => void;
  onAddBulkParticipants: () => void;
  onAdminEmailsChange: (value: string) => void;
  onApplyManualMove: () => void;
  onArchiveSweepstake: () => void;
  onBulkParticipantTextChange: (value: string) => void;
  onCopyShareLink: () => void;
  onSharedViewModeChange: (mode: SharedViewMode) => void;
  onDeleteParticipant: (participantId: string) => void;
  onMoveParticipantChange: (participantId: string) => void;
  onMoveTeamChange: (teamId: string) => void;
  onParticipantChange: (
    participantId: string,
    field: "name" | "email",
    value: string,
  ) => void;
  onParticipantEmailDraftChange: (value: string) => void;
  onParticipantNameDraftChange: (value: string) => void;
  onSaveParticipantEdit: (
    participantId: string,
    field: "name" | "email",
    value: string,
  ) => void;
  onRunAllocation: (action: "initial-draw" | "rerun") => void;
  onSaveSettings: () => void;
  onSweepstakeNameChange: (value: string) => void;
  onTournamentChange: (tournamentCode: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">
          My sweepstakes / {sweepstakeName}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">
          {sweepstakeName}
        </h1>
        {saveStatus ? (
          <p className="mt-2 text-sm text-muted-foreground">{saveStatus}</p>
        ) : null}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as AdminTab)}
      >
        <TabsList
          className="w-full justify-start overflow-x-auto"
          variant="line"
        >
          <TabsTrigger value="overview">
            <BarChart3 className="size-4" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="size-4" aria-hidden="true" />
            Participants
          </TabsTrigger>
          <TabsTrigger value="draw">
            <Shuffle className="size-4" aria-hidden="true" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="size-4" aria-hidden="true" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab
            allocationCount={allocations.length}
            auditEventCount={auditEvents.length}
            emailCount={emailCount}
            participantCount={participants.length}
            shareCopied={shareCopied}
            shareLink={shareLink}
            sharedViewMode={sharedViewMode}
            spreadLabel={`${spread.min}-${spread.max}`}
            teamCount={teams.length}
            syncDiagnostics={syncDiagnostics}
            onCopyShareLink={onCopyShareLink}
            onSharedViewModeChange={onSharedViewModeChange}
          />
        </TabsContent>

        <TabsContent value="participants" className="mt-5">
          <ParticipantsTab
            duplicateNames={duplicateNames}
            bulkParticipantText={bulkParticipantText}
            participantEmail={participantEmail}
            participantName={participantName}
            participants={participants}
            teamCount={teams.length}
            onAddParticipant={onAddParticipant}
            onAddBulkParticipants={onAddBulkParticipants}
            onBulkParticipantTextChange={onBulkParticipantTextChange}
            onDeleteParticipant={onDeleteParticipant}
            onParticipantChange={onParticipantChange}
            onParticipantEmailDraftChange={onParticipantEmailDraftChange}
            onParticipantNameDraftChange={onParticipantNameDraftChange}
            onSaveParticipantEdit={onSaveParticipantEdit}
          />
        </TabsContent>

        <TabsContent value="draw" className="mt-5">
          <AllocationSection
            allocations={allocations}
            auditEvents={auditEvents}
            canAllocate={canAllocate}
            moveParticipantId={moveParticipantId}
            moveTeamId={moveTeamId}
            participants={participants}
            shareCopied={shareCopied}
            shareLink={shareLink}
            spread={spread}
            teams={teams}
            hasUnsavedParticipants={hasUnsavedParticipants}
            onApplyManualMove={onApplyManualMove}
            onCopyShareLink={onCopyShareLink}
            onMoveParticipantChange={onMoveParticipantChange}
            onMoveTeamChange={onMoveTeamChange}
            onRunAllocation={onRunAllocation}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-5">
          <SettingsTab
            adminEmails={adminEmails}
            isOwner={isOwner}
            sweepstakeName={sweepstakeName}
            teamCount={teams.length}
            tournamentCode={tournamentCode}
            onArchiveSweepstake={onArchiveSweepstake}
            onAdminEmailsChange={onAdminEmailsChange}
            onSaveSettings={onSaveSettings}
            onSweepstakeNameChange={onSweepstakeNameChange}
            onTournamentChange={onTournamentChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  allocationCount,
  auditEventCount,
  emailCount,
  participantCount,
  shareCopied,
  shareLink,
  sharedViewMode,
  spreadLabel,
  teamCount,
  syncDiagnostics,
  onCopyShareLink,
  onSharedViewModeChange,
}: {
  allocationCount: number;
  auditEventCount: number;
  emailCount: number;
  participantCount: number;
  shareCopied: boolean;
  shareLink: string;
  sharedViewMode: SharedViewMode;
  spreadLabel: string;
  teamCount: number;
  syncDiagnostics: SyncDiagnostics | null;
  onCopyShareLink: () => void;
  onSharedViewModeChange: (mode: SharedViewMode) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>Setup status</CardTitle>
          <CardDescription>
            Admin-only snapshot using account-scoped Supabase data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Metric label="Teams" value={`${teamCount}`} />
          <Metric label="Participants" value={`${participantCount}`} />
          <Metric label="Fair split" value={spreadLabel} />
          <Metric label="Email-ready" value={`${emailCount}`} />
        </CardContent>
      </Card>

      <Card className="bg-surface-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Guardrails
          </CardTitle>
          <CardDescription>
            Core sweepstake rules remain deterministic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusRow label="Frontend API calls" value="None" tone="success" />
          <StatusRow label="Allocated teams" value={`${allocationCount}`} tone="info" />
          <StatusRow label="Audit events" value={`${auditEventCount}`} tone="info" />
        </CardContent>
      </Card>

      <SyncDiagnosticsPanel diagnostics={syncDiagnostics} />

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="size-4 text-primary" aria-hidden="true" />
            Share link
          </CardTitle>
          <CardDescription>
            The same shared link can show the participant board or pre-tournament countdown page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1 rounded-lg border bg-surface-muted p-3">
              <p className="break-all font-mono text-sm">{shareLink}</p>
            </div>
            <Button onClick={onCopyShareLink}>
              <Copy className="size-4" aria-hidden="true" />
              {shareCopied ? "Copied" : "Copy link"}
            </Button>
          </div>
          {allocationCount > 0 ? (
            <div className="rounded-lg border bg-surface-muted p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Shared link display</p>
                  <p className="text-xs text-muted-foreground">
                    Switch what participants see without changing the URL.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    aria-pressed={sharedViewMode === "participant_board"}
                    onClick={() => onSharedViewModeChange("participant_board")}
                    size="sm"
                    variant={
                      sharedViewMode === "participant_board" ? "default" : "outline"
                    }
                  >
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    Participant page
                  </Button>
                  <Button
                    aria-pressed={sharedViewMode === "countdown"}
                    onClick={() => onSharedViewModeChange("countdown")}
                    size="sm"
                    variant={sharedViewMode === "countdown" ? "default" : "outline"}
                  >
                    <Clock3 className="size-4" aria-hidden="true" />
                    Countdown page
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ParticipantsTab({
  duplicateNames,
  bulkParticipantText,
  participantEmail,
  participantName,
  participants,
  teamCount,
  onAddParticipant,
  onAddBulkParticipants,
  onBulkParticipantTextChange,
  onDeleteParticipant,
  onParticipantChange,
  onParticipantEmailDraftChange,
  onParticipantNameDraftChange,
  onSaveParticipantEdit,
}: {
  duplicateNames: string[];
  bulkParticipantText: string;
  participantEmail: string;
  participantName: string;
  participants: ParticipantDraft[];
  teamCount: number;
  onAddParticipant: () => void;
  onAddBulkParticipants: () => void;
  onBulkParticipantTextChange: (value: string) => void;
  onDeleteParticipant: (participantId: string) => void;
  onParticipantChange: (
    participantId: string,
    field: "name" | "email",
    value: string,
  ) => void;
  onParticipantEmailDraftChange: (value: string) => void;
  onParticipantNameDraftChange: (value: string) => void;
  onSaveParticipantEdit: (
    participantId: string,
    field: "name" | "email",
    value: string,
  ) => void;
}) {
  const bulkParticipantNames = useMemo(
    () => parseBulkParticipantNames(bulkParticipantText),
    [bulkParticipantText],
  );
  const bulkDuplicateNames = useMemo(
    () => getDuplicateBulkParticipantNames(bulkParticipantNames),
    [bulkParticipantNames],
  );
  const existingBulkDuplicateNames = useMemo(() => {
    const participantNames = new Set(
      participants.map((participant) => participant.name.trim().toLowerCase()),
    );

    return bulkParticipantNames.filter((name) =>
      participantNames.has(name.toLowerCase()),
    );
  }, [bulkParticipantNames, participants]);
  const canAddBulkParticipants =
    bulkParticipantNames.length > 0 &&
    bulkDuplicateNames.length === 0 &&
    existingBulkDuplicateNames.length === 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Total" value={`${participants.length}`} />
        <Metric
          label="Email-ready"
          value={`${participants.filter((participant) => participant.email).length}`}
        />
        <Metric
          label="Without email"
          value={`${participants.filter((participant) => !participant.email).length}`}
        />
        <Metric label="Saved" value={`${participants.length}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add participant</CardTitle>
          <CardDescription>
            Add one person at a time. Changes save to Supabase immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Input
              aria-label="Participant name"
              value={participantName}
              onChange={(event) => onParticipantNameDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onAddParticipant();
                }
              }}
              placeholder="Name"
            />
            <Input
              aria-label="Participant email"
              type="email"
              value={participantEmail}
              onChange={(event) => onParticipantEmailDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onAddParticipant();
                }
              }}
              placeholder="Email optional"
            />
            <Button disabled={!participantName.trim()} onClick={onAddParticipant}>
              Add
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="bulk-participant-names">
                Add several participants
              </Label>
              <p className="text-sm text-muted-foreground">
                Paste comma-separated names. Emails can be added afterwards.
              </p>
            </div>
            <Textarea
              id="bulk-participant-names"
              aria-label="Bulk participant names"
              className="min-h-24"
              value={bulkParticipantText}
              onChange={(event) =>
                onBulkParticipantTextChange(event.target.value)
              }
              placeholder="Person One, Person Two, Person Three"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  {bulkParticipantNames.length === 0
                    ? "No pasted names ready."
                    : `${bulkParticipantNames.length} pasted ${
                        bulkParticipantNames.length === 1 ? "name" : "names"
                      } ready.`}
                </p>
                {bulkDuplicateNames.length > 0 ? (
                  <p className="font-medium text-destructive">
                    Duplicate pasted names: {bulkDuplicateNames.join(", ")}
                  </p>
                ) : null}
                {existingBulkDuplicateNames.length > 0 ? (
                  <p className="font-medium text-destructive">
                    Already added: {existingBulkDuplicateNames.join(", ")}
                  </p>
                ) : null}
              </div>
              <Button
                disabled={!canAddBulkParticipants}
                onClick={onAddBulkParticipants}
              >
                Add participants
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Participants {formatParticipantCapacity(participants.length, teamCount)}
          </CardTitle>
          <CardDescription>
            Optional emails enable future updates without changing allocation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="rounded-lg border bg-surface-muted p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    aria-label={`Participant name for ${participant.name}`}
                    className="h-8 min-w-0 font-semibold"
                    value={participant.name}
                    onChange={(event) =>
                      onParticipantChange(
                        participant.id,
                        "name",
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSaveParticipantEdit(
                          participant.id,
                          "name",
                          event.currentTarget.value,
                        );
                      }
                    }}
                  />
                  <Badge variant={participant.email ? "secondary" : "outline"}>
                    {participant.email ? "Email" : "No email"}
                  </Badge>
                </div>
                <div className="relative mt-2">
                  <Mail
                    className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    className="h-8 pl-7"
                    value={participant.email}
                    onChange={(event) =>
                      onParticipantChange(
                        participant.id,
                        "email",
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSaveParticipantEdit(
                          participant.id,
                          "email",
                          event.currentTarget.value,
                        );
                      }
                    }}
                    placeholder="Optional email"
                    type="email"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Press Enter or Save after editing
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        onSaveParticipantEdit(
                          participant.id,
                          "name",
                          participant.name,
                        )
                      }
                      size="sm"
                      variant="outline"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => onDeleteParticipant(participant.id)}
                      size="sm"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div>
            {duplicateNames.length > 0 ? (
              <p className="text-sm font-medium text-destructive">
                Duplicate names: {duplicateNames.join(", ")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Adds and deletes save immediately. After editing a name or email,
                press Enter or click Save before refreshing.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab({
  adminEmails,
  isOwner,
  sweepstakeName,
  teamCount,
  tournamentCode,
  onArchiveSweepstake,
  onAdminEmailsChange,
  onSaveSettings,
  onSweepstakeNameChange,
  onTournamentChange,
}: {
  adminEmails: string;
  isOwner: boolean;
  sweepstakeName: string;
  teamCount: number;
  tournamentCode: string;
  onArchiveSweepstake: () => void;
  onAdminEmailsChange: (value: string) => void;
  onSaveSettings: () => void;
  onSweepstakeNameChange: (value: string) => void;
  onTournamentChange: (tournamentCode: string) => void;
}) {
  const [pendingTournamentCode, setPendingTournamentCode] = useState("");
  const pendingTournament = footballDataTournaments.find(
    (tournament) => tournament.code === pendingTournamentCode,
  );
  const activeTournament =
    footballDataTournaments.find(
      (tournament) => tournament.code === tournamentCode,
    ) ?? footballDataTournaments[0];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clipboard className="size-4 text-primary" aria-hidden="true" />
            Sweepstake settings
          </CardTitle>
          <CardDescription>
            Name, tournament, admins, and badge categories for this sweepstake.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sweepstake-name">Sweepstake name</Label>
            <Input
              id="sweepstake-name"
              value={sweepstakeName}
              onChange={(event) => onSweepstakeNameChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tournament">Tournament</Label>
            <select
              id="tournament"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={activeTournament.code}
              onChange={(event) => {
                const nextTournamentCode = event.target.value;

                if (nextTournamentCode !== activeTournament.code) {
                  setPendingTournamentCode(nextTournamentCode);
                }
              }}
            >
              {footballDataTournaments.map((tournament) => (
                <option key={tournament.code} value={tournament.code}>
                  {tournament.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Active: {activeTournament.label} with {teamCount} cached teams.
              Validation datasets require football-data.org access; if sync is
              rejected or rate-limited, this sweepstake stays on the active
              dataset.
            </p>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="admin-emails">Admin emails</Label>
            <Textarea
              id="admin-emails"
              value={adminEmails}
              onChange={(event) => onAdminEmailsChange(event.target.value)}
              placeholder="one admin email per line"
            />
          </div>
          <div className="lg:col-span-2">
            <Button onClick={onSaveSettings}>Save settings</Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(pendingTournamentCode)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTournamentCode("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change tournament dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing to {pendingTournament?.label ?? "another dataset"} resets
              this sweepstake&apos;s team draw, leaderboard scores, badge holders,
              and cached AI/email outputs only if teams for that dataset can be
              cached. Participants and admins are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingTournamentCode) {
                  onTournamentChange(pendingTournamentCode);
                  setPendingTournamentCode("");
                }
              }}
            >
              Change dataset and reset draw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOwner ? (
        <Card className="border-destructive/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="size-4 text-destructive" aria-hidden="true" />
              Archive sweepstake
            </CardTitle>
            <CardDescription>
              Remove this sweepstake from your dashboard and disable the shared link.
              Participant, allocation, and audit data stays stored in Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Archive className="size-4" aria-hidden="true" />
                  Archive sweepstake
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this sweepstake?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes it from the admin dashboard and turns off the
                    participant share link. The underlying records are retained.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={onArchiveSweepstake}
                  >
                    Archive sweepstake
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
            Badge categories
          </CardTitle>
          <CardDescription>
            Automated badges are visible; free-tier gaps are marked as future.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Automated" value={`${automatedBadges.length}`} />
            <Metric label="Future" value={`${manualFutureBadges.length}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {automatedBadges.map((badge) => (
              <Badge key={badge} variant="secondary">
                <Check className="size-3" aria-hidden="true" />
                {badge}
              </Badge>
            ))}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            {manualFutureBadges.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error != null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong while saving. Please try again.";
}
