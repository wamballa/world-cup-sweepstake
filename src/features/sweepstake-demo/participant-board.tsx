"use client";

import { UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

import { SharedScoreboard } from "./shared-scoreboard";

export function ParticipantBoard({
  shareToken,
  boardData,
}: {
  shareToken: string;
  boardData: SharedBoardData;
}) {
  const standings = useMemo(() => boardData.standings, [boardData]);
  const leadingParticipant = standings[0];
  const storageKey = `world-cup-sweepstake:selected-participant:${shareToken}`;
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [draftParticipantId, setDraftParticipantId] = useState("");
  const [isChoosing, setIsChoosing] = useState(true);

  useEffect(() => {
    const savedParticipantId = getSavedParticipantId(shareToken);

    if (!savedParticipantId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedParticipantId(savedParticipantId);
      setDraftParticipantId(savedParticipantId);
      setIsChoosing(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [shareToken]);

  const selectedParticipant = standings.find(
    (standing) => standing.participantId === selectedParticipantId,
  );

  function saveParticipantChoice() {
    if (!draftParticipantId) {
      return;
    }

    window.localStorage.setItem(storageKey, draftParticipantId);
    setSelectedParticipantId(draftParticipantId);
    setIsChoosing(false);
  }

  function switchParticipant() {
    setDraftParticipantId(selectedParticipantId ?? "");
    setIsChoosing(true);
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground md:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <ParticipantIdentityCard
          draftParticipantId={draftParticipantId}
          isChoosing={isChoosing}
          selectedParticipantName={selectedParticipant?.name}
          standings={standings}
          onDraftParticipantChange={setDraftParticipantId}
          onSaveParticipantChoice={saveParticipantChoice}
          onSwitchParticipant={switchParticipant}
        />

        <SharedScoreboard
          selectedParticipantId={selectedParticipantId}
          boardData={boardData}
          leadingParticipant={leadingParticipant}
        />
      </div>
    </main>
  );
}

function getSavedParticipantId(shareToken: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(
    `world-cup-sweepstake:selected-participant:${shareToken}`,
  );
}

function ParticipantIdentityCard({
  draftParticipantId,
  isChoosing,
  selectedParticipantName,
  standings,
  onDraftParticipantChange,
  onSaveParticipantChoice,
  onSwitchParticipant,
}: {
  draftParticipantId: string;
  isChoosing: boolean;
  selectedParticipantName?: string;
  standings: SharedBoardData["standings"];
  onDraftParticipantChange: (participantId: string) => void;
  onSaveParticipantChoice: () => void;
  onSwitchParticipant: () => void;
}) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <UserRound className="size-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-normal">
            Participant board
          </span>
        </div>
        <CardTitle className="text-xl">Who are you?</CardTitle>
        <CardDescription>
          Choose your name to personalize the shared board on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedParticipantName && !isChoosing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Viewing as</Badge>
              <p className="font-semibold">{selectedParticipantName}</p>
            </div>
            <Button size="sm" variant="outline" onClick={onSwitchParticipant}>
              Switch
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="participant-identity">Your name</Label>
              <select
                id="participant-identity"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={draftParticipantId}
                onChange={(event) =>
                  onDraftParticipantChange(event.target.value)
                }
              >
                <option value="">Choose a participant</option>
                {standings.map((standing) => (
                  <option
                    key={standing.participantId}
                    value={standing.participantId}
                  >
                    {standing.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              disabled={!draftParticipantId}
              onClick={onSaveParticipantChoice}
            >
              Show my sweepstake
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
