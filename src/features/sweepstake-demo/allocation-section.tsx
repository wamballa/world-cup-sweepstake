import { Copy, RefreshCw, Share2, Shuffle } from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type {
  AllocationAudit,
  TeamAllocation,
} from "@/features/allocation/fair-allocation";
import {
  getParticipantTeamCount,
  getTeamsForParticipant,
} from "./demo-helpers";
import { EmptyState, Metric } from "./demo-primitives";
import type { AllocationSpread, DrawTeam, ParticipantDraft } from "./types";

export function AllocationSection({
  allocations,
  auditEvents,
  canAllocate,
  hasUnsavedParticipants,
  moveParticipantId,
  moveTeamId,
  participants,
  shareCopied,
  shareLink,
  spread,
  teams,
  onApplyManualMove,
  onCopyShareLink,
  onMoveParticipantChange,
  onMoveTeamChange,
  onRunAllocation,
}: {
  allocations: TeamAllocation[];
  auditEvents: AllocationAudit[];
  canAllocate: boolean;
  hasUnsavedParticipants: boolean;
  moveParticipantId: string;
  moveTeamId: string;
  participants: ParticipantDraft[];
  shareCopied: boolean;
  shareLink: string;
  spread: AllocationSpread;
  teams: DrawTeam[];
  onApplyManualMove: () => void;
  onCopyShareLink: () => void;
  onMoveParticipantChange: (participantId: string) => void;
  onMoveTeamChange: (teamId: string) => void;
  onRunAllocation: (action: "initial-draw" | "rerun") => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <AllocationReviewCard
        allocations={allocations}
        canAllocate={canAllocate}
        hasUnsavedParticipants={hasUnsavedParticipants}
        moveParticipantId={moveParticipantId}
        moveTeamId={moveTeamId}
        participants={participants}
        spread={spread}
        teams={teams}
        onApplyManualMove={onApplyManualMove}
        onMoveParticipantChange={onMoveParticipantChange}
        onMoveTeamChange={onMoveTeamChange}
        onRunAllocation={onRunAllocation}
      />
      <ShareBoardCard
        allocations={allocations}
        auditEvents={auditEvents}
        shareCopied={shareCopied}
        shareLink={shareLink}
        onCopyShareLink={onCopyShareLink}
      />
    </section>
  );
}

function AllocationReviewCard({
  allocations,
  canAllocate,
  hasUnsavedParticipants,
  moveParticipantId,
  moveTeamId,
  participants,
  spread,
  teams,
  onApplyManualMove,
  onMoveParticipantChange,
  onMoveTeamChange,
  onRunAllocation,
}: {
  allocations: TeamAllocation[];
  canAllocate: boolean;
  hasUnsavedParticipants: boolean;
  moveParticipantId: string;
  moveTeamId: string;
  participants: ParticipantDraft[];
  spread: AllocationSpread;
  teams: DrawTeam[];
  onApplyManualMove: () => void;
  onMoveParticipantChange: (participantId: string) => void;
  onMoveTeamChange: (teamId: string) => void;
  onRunAllocation: (action: "initial-draw" | "rerun") => void;
}) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shuffle className="size-4 text-primary" />
          Allocation review
        </CardTitle>
        <CardDescription>
          Run a fair random draw, rerun it, or move one team manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Allocated" value={`${allocations.length}`} />
          <Metric label="Minimum" value={`${spread.min}`} />
          <Metric label="Maximum" value={`${spread.max}`} />
          <Metric label="Spread" value={`${spread.max - spread.min}`} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            disabled={!canAllocate || teams.length === 0}
            onClick={() => onRunAllocation("initial-draw")}
          >
            <Shuffle className="size-4" aria-hidden="true" />
            Randomly allocate teams
          </Button>
          <Button
            disabled={allocations.length === 0}
            variant="outline"
            onClick={() => onRunAllocation("rerun")}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Rerun allocation
          </Button>
        </div>
        {hasUnsavedParticipants ? (
          <p className="text-sm text-muted-foreground">
            Save participants before running the draw.
          </p>
        ) : null}

        {allocations.length > 0 ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="move-team">Team</Label>
                <select
                  id="move-team"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={moveTeamId}
                  onChange={(event) => onMoveTeamChange(event.target.value)}
                >
                  {teams.map((team) => (
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
                    onMoveParticipantChange(event.target.value)
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
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={onApplyManualMove}
                >
                  Move team
                </Button>
              </div>
            </div>

            <motion.div
              className="grid gap-3 md:grid-cols-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.025 },
                },
              }}
            >
              {participants.map((participant) => (
                <motion.div
                  key={participant.id}
                  className="rounded-lg border bg-surface-muted p-3"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{participant.name}</p>
                    <Badge variant="outline">
                      {getParticipantTeamCount(participant.id, allocations)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getTeamsForParticipant(
                      participant.id,
                      allocations,
                      teams,
                    ).map(
                      (team) => (
                        <Badge key={team.id} variant="secondary">
                          {team.shortName}
                        </Badge>
                      ),
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <EmptyState
            title="Allocation waiting"
            body="Run the draw to preview each participant's team set."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ShareBoardCard({
  allocations,
  auditEvents,
  shareCopied,
  shareLink,
  onCopyShareLink,
}: {
  allocations: TeamAllocation[];
  auditEvents: AllocationAudit[];
  shareCopied: boolean;
  shareLink: string;
  onCopyShareLink: () => void;
}) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="size-4 text-primary" />
          Share board
        </CardTitle>
        <CardDescription>Read-only participant link preview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-surface-muted p-3">
          <p className="break-all font-mono text-sm">{shareLink}</p>
        </div>
        <Button
          className="w-full"
          disabled={allocations.length === 0}
          onClick={onCopyShareLink}
        >
          <Copy className="size-4" aria-hidden="true" />
          {shareCopied ? "Copied" : "Copy link"}
        </Button>
        <Separator />
        <div className="space-y-2">
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
              Allocation audit appears after the first draw.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
