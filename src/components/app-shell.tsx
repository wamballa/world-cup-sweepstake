"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clipboard,
  Copy,
  Crown,
  Mail,
  Menu,
  RefreshCw,
  ShieldCheck,
  Shuffle,
  Trophy,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createAllocationAudit,
  createFairAllocation,
  getAllocationSpread,
  moveAllocatedTeam,
  type AllocationAudit,
  type TeamAllocation,
} from "@/features/allocation/fair-allocation";
import { mockTeams } from "@/features/mock-data/world-cup-2026";

type ParticipantDraft = {
  id: string;
  name: string;
  email: string;
};

const defaultNames = ["Maya", "Theo", "Priya", "Alex", "Nina", "Sam"].join("\n");

const badgeSettings = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "4th Place",
  "Wooden Spoon",
  "First Knocked Out",
  "Most Goals Conceded",
  "Fewest Goals Scored",
];

const manualFutureBadges = ["Most Cards", "Golden Boot Team", "Golden Glove Team"];

const setupSteps = [
  "Create",
  "Participants",
  "Badges",
  "Admins",
  "Allocate",
  "Share",
];

export function AppShell() {
  const [sweepstakeName, setSweepstakeName] = useState("Friday Office Draw");
  const [participantText, setParticipantText] = useState(defaultNames);
  const [emailsByName, setEmailsByName] = useState<Record<string, string>>({});
  const [adminEmails, setAdminEmails] = useState("ops@example.com");
  const [allocations, setAllocations] = useState<TeamAllocation[]>([]);
  const [auditEvents, setAuditEvents] = useState<AllocationAudit[]>([]);
  const [moveTeamId, setMoveTeamId] = useState("");
  const [moveParticipantId, setMoveParticipantId] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const participants = useMemo(
    () => parseParticipants(participantText, emailsByName),
    [emailsByName, participantText],
  );
  const duplicateNames = useMemo(() => getDuplicateNames(participants), [participants]);
  const participantIds = participants.map((participant) => participant.id);
  const spread =
    allocations.length > 0 && participants.length > 0
      ? getAllocationSpread(participantIds, allocations)
      : getProjectedSpread(participants.length, mockTeams.length);
  const shareToken = useMemo(() => createShareToken(sweepstakeName), [sweepstakeName]);
  const shareLink = `https://sweepstake.local/s/${shareToken}`;
  const canAllocate = sweepstakeName.trim().length > 0 && participants.length > 0;
  const confirmedBadgeCount = badgeSettings.length;

  function runAllocation(action: "initial-draw" | "rerun") {
    if (!canAllocate) {
      return;
    }

    const nextAllocations = createFairAllocation(participants, mockTeams);
    setAllocations(nextAllocations);
    setMoveTeamId(nextAllocations[0]?.teamId ?? "");
    setMoveParticipantId(nextAllocations[0]?.participantId ?? "");
    setAuditEvents((current) => [
      createAllocationAudit(
        action,
        `${mockTeams.length} teams allocated across ${participants.length} participants.`,
      ),
      ...current,
    ]);
  }

  function applyManualMove() {
    if (!moveTeamId || !moveParticipantId) {
      return;
    }

    setAllocations((current) =>
      moveAllocatedTeam(current, moveTeamId, moveParticipantId),
    );
    setAuditEvents((current) => [
      createAllocationAudit(
        "manual-move",
        `${getTeamName(moveTeamId)} moved to ${getParticipantName(moveParticipantId, participants)}.`,
      ),
      ...current,
    ]);
  }

  async function copyShareLink() {
    setShareCopied(true);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareLink);
    }

    window.setTimeout(() => setShareCopied(false), 1600);
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  World Cup Sweepstake
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Core setup, allocation, and sharing
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Badge variant="outline" className="border-primary/30 text-primary">
                Phase 2
              </Badge>
              <Button size="sm" onClick={() => runAllocation("initial-draw")}>
                <Shuffle className="size-3.5" aria-hidden="true" />
                Allocate
              </Button>
            </div>
            <Button size="icon" variant="ghost" className="md:hidden">
              <Menu aria-hidden="true" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-5 px-4 py-5 pb-24 md:grid-cols-[18rem_1fr] md:px-6 md:pb-6 lg:grid-cols-[20rem_1fr]">
          <aside className="hidden md:block" aria-label="Setup progress">
            <Card className="sticky top-20 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Phase 2 setup</CardTitle>
                <CardDescription>
                  Backlog `BL-016` through `BL-024` plus `BL-069`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {setupSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{step}</p>
                      <p className="text-xs text-muted-foreground">
                        {getStepState(index, allocations.length)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="bg-card">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      Admin setup
                    </Badge>
                    <Badge variant="secondary">FIFA World Cup 2026</Badge>
                    <Badge variant="outline">Mock data</Badge>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">
                    Build the sweepstake, draw the teams, share the board.
                  </CardTitle>
                  <CardDescription className="text-base leading-7">
                    This flow covers the core Phase 2 backlog with local state
                    ready for Supabase persistence later.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Teams" value={`${mockTeams.length}`} />
                  <Metric label="Participants" value={`${participants.length}`} />
                  <Metric label="Fair split" value={`${spread.min}-${spread.max}`} />
                </CardContent>
              </Card>

              <Card className="bg-surface-raised">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="size-4 text-primary" />
                    Allocation guardrails
                  </CardTitle>
                  <CardDescription>
                    All teams stay assigned, and spread is kept explainable.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatusRow label="All teams" value="48 assigned" />
                  <StatusRow label="Spread limit" value="Max difference 1" />
                  <StatusRow label="Audit trail" value={`${auditEvents.length} events`} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clipboard className="size-4 text-primary" />
                    Sweepstake details
                  </CardTitle>
                  <CardDescription>
                    `BL-016` and `BL-017`: create flow, name, and locked
                    tournament setting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sweepstake-name">Sweepstake name</Label>
                    <Input
                      id="sweepstake-name"
                      value={sweepstakeName}
                      onChange={(event) => setSweepstakeName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tournament">Tournament</Label>
                    <Input
                      id="tournament"
                      value="FIFA World Cup 2026"
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BadgeCheck className="size-4 text-primary" />
                    Badge settings
                  </CardTitle>
                  <CardDescription>
                    `BL-018`: automated defaults plus clear manual/future
                    categories.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-surface-muted p-3">
                    <span className="text-sm text-muted-foreground">
                      Enabled by default
                    </span>
                    <Badge>{confirmedBadgeCount}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badgeSettings.map((badge) => (
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

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersRound className="size-4 text-primary" />
                  Participants and email updates
                </CardTitle>
                <CardDescription>
                  `BL-019` and `BL-020`: paste names quickly, then add optional
                  participant emails without slowing the draw.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
                <div className="space-y-2">
                  <Label htmlFor="participants">Bulk participant names</Label>
                  <Textarea
                    id="participants"
                    className="min-h-52"
                    value={participantText}
                    onChange={(event) => setParticipantText(event.target.value)}
                    placeholder="Paste one participant per line"
                  />
                  <p className="text-xs text-muted-foreground">
                    Empty lines are ignored. Duplicate names are flagged before
                    allocation.
                  </p>
                  {duplicateNames.length > 0 ? (
                    <p className="text-sm font-medium text-destructive">
                      Duplicate names: {duplicateNames.join(", ")}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="grid gap-2 rounded-lg border bg-surface-muted p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {participant.name}
                        </p>
                        <Badge variant="outline">
                          {getParticipantTeamCount(participant.id, allocations)} teams
                        </Badge>
                      </div>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          className="pl-7"
                          value={participant.email}
                          onChange={(event) =>
                            setEmailsByName((current) => ({
                              ...current,
                              [participant.name]: event.target.value,
                            }))
                          }
                          placeholder="Optional email"
                          type="email"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="size-4 text-primary" />
                    Other admins
                  </CardTitle>
                  <CardDescription>
                    `BL-021`: capture extra admin emails now; auth invitations
                    wire in during Supabase Auth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label htmlFor="admin-emails">Admin emails</Label>
                  <Textarea
                    id="admin-emails"
                    value={adminEmails}
                    onChange={(event) => setAdminEmails(event.target.value)}
                    placeholder="one admin email per line"
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {parseAdminEmails(adminEmails).map((email) => (
                      <Badge key={email} variant="secondary">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shuffle className="size-4 text-primary" />
                    Team draw
                  </CardTitle>
                  <CardDescription>
                    `BL-022`: fair random allocation for all 48 teams.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    disabled={!canAllocate}
                    onClick={() => runAllocation("initial-draw")}
                  >
                    <Shuffle className="size-4" aria-hidden="true" />
                    Randomly allocate teams
                  </Button>
                  <Button
                    className="w-full"
                    disabled={allocations.length === 0}
                    variant="outline"
                    onClick={() => runAllocation("rerun")}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Rerun allocation
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Reruns replace the previous allocation and add a fresh audit
                    event.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="size-4 text-primary" />
                  Allocation review and manual moves
                </CardTitle>
                <CardDescription>
                  `BL-023` and `BL-069`: review the draw, rerun, or move a team
                  before sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Allocated teams" value={`${allocations.length}`} />
                  <Metric label="Minimum teams" value={`${spread.min}`} />
                  <Metric label="Maximum teams" value={`${spread.max}`} />
                </div>

                {allocations.length > 0 ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="move-team">Team</Label>
                        <select
                          id="move-team"
                          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                          value={moveTeamId}
                          onChange={(event) => setMoveTeamId(event.target.value)}
                        >
                          {mockTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="move-participant">Move to</Label>
                        <select
                          id="move-participant"
                          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                          value={moveParticipantId}
                          onChange={(event) =>
                            setMoveParticipantId(event.target.value)
                          }
                        >
                          {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full" onClick={applyManualMove}>
                          <ArrowRight className="size-4" aria-hidden="true" />
                          Move team
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="rounded-lg border bg-surface-muted p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">
                              {participant.name}
                            </p>
                            <Badge variant="outline">
                              {getParticipantTeamCount(participant.id, allocations)}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getTeamsForParticipant(participant.id, allocations).map(
                              (team) => (
                                <Badge key={team.id} variant="secondary">
                                  {team.shortName}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed bg-surface-muted p-6 text-center">
                    <p className="text-sm font-medium">No allocation yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add participants, then run the random draw.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Copy className="size-4 text-primary" />
                    Shared scoreboard link
                  </CardTitle>
                  <CardDescription>
                    `BL-024`: generate a read-only, unguessable-style link for
                    the participant scoreboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-surface-muted p-3">
                    <p className="break-all font-mono text-sm">{shareLink}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      disabled={allocations.length === 0}
                      onClick={copyShareLink}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                      {shareCopied ? "Copied" : "Copy link"}
                    </Button>
                    <Button disabled={allocations.length === 0} variant="outline">
                      Open scoreboard preview
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can view the scoreboard. Only admins can
                    edit setup or allocation.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Allocation audit</CardTitle>
                  <CardDescription>
                    Draws, reruns, and manual moves are recorded for later
                    persistence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditEvents.length > 0 ? (
                    auditEvents.slice(0, 4).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-lg border bg-surface-muted p-3"
                      >
                        <p className="text-sm font-semibold">{event.action}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.note}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border bg-surface-muted p-3 text-sm text-muted-foreground">
                      Audit events appear after the first allocation.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface-muted p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-surface-muted p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="rounded-md bg-success px-2 py-1 text-xs font-medium text-success-foreground">
        {value}
      </span>
    </div>
  );
}

function parseParticipants(
  participantText: string,
  emailsByName: Record<string, string>,
): ParticipantDraft[] {
  return participantText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `participant-${slugify(name)}-${index}`,
      name,
      email: emailsByName[name] ?? "",
    }));
}

function parseAdminEmails(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function getDuplicateNames(participants: ParticipantDraft[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  participants.forEach((participant) => {
    const key = participant.name.toLowerCase();

    if (seen.has(key)) {
      duplicates.add(participant.name);
    }

    seen.add(key);
  });

  return [...duplicates];
}

function getProjectedSpread(participantCount: number, teamCount: number) {
  if (participantCount === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.floor(teamCount / participantCount),
    max: Math.ceil(teamCount / participantCount),
  };
}

function getParticipantTeamCount(
  participantId: string,
  allocations: TeamAllocation[],
) {
  return allocations.filter((allocation) => allocation.participantId === participantId)
    .length;
}

function getTeamsForParticipant(
  participantId: string,
  allocations: TeamAllocation[],
) {
  const teamIds = allocations
    .filter((allocation) => allocation.participantId === participantId)
    .map((allocation) => allocation.teamId);

  return mockTeams.filter((team) => teamIds.includes(team.id));
}

function getTeamName(teamId: string) {
  return mockTeams.find((team) => team.id === teamId)?.name ?? "Unknown team";
}

function getParticipantName(
  participantId: string,
  participants: ParticipantDraft[],
) {
  return (
    participants.find((participant) => participant.id === participantId)?.name ??
    "Unknown participant"
  );
}

function createShareToken(sweepstakeName: string) {
  const source = sweepstakeName.trim() || "sweepstake";
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  return `${slugify(source)}-${Math.abs(hash).toString(36).padStart(6, "0")}`;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

function getStepState(index: number, allocationCount: number) {
  if (index < 4) {
    return "Ready";
  }

  if (index === 4) {
    return allocationCount > 0 ? "Done" : "Ready";
  }

  return allocationCount > 0 ? "Ready" : "Locked";
}
