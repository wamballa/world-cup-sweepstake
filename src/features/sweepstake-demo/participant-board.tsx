"use client";

import { Bell, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  CampaignHeader,
  CampaignHeading,
  CampaignLogoMark,
  CampaignPageStack,
  CampaignPanel,
  CampaignPill,
  CampaignShell,
} from "@/components/campaign";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

import { AiSweepstakeUpdateButton } from "./ai-sweepstake-update-button";
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
    <CampaignShell>
      <CampaignPageStack>
        <CampaignHeader
          logo={
            <CampaignLogoMark
              alt="World Cup sweepstake logo"
              src="/brand/logo1-web.png"
            />
          }
          actions={
            <div className="grid grid-cols-3 gap-2 text-center">
              <HeaderStatus
                icon={<UsersRound className="size-5" aria-hidden="true" />}
                label="Players"
                value={`${boardData.participants.length}`}
              />
              <HeaderStatus
                icon={<ShieldCheck className="size-5" aria-hidden="true" />}
                label="Teams"
                value={`${boardData.teams.length}`}
              />
              <HeaderStatus
                icon={<Bell className="size-5" aria-hidden="true" />}
                label="Updates"
                value={boardData.syncState.freshnessLabel}
              />
            </div>
          }
        >
          <CampaignHeading eyebrow="Shared sweepstake board">
            {boardData.sweepstakeName || "Untitled sweepstake"}
          </CampaignHeading>
        </CampaignHeader>

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
      </CampaignPageStack>
      <AiSweepstakeUpdateButton
        freshnessLabel={boardData.syncState.freshnessLabel}
        shareToken={shareToken}
      />
    </CampaignShell>
  );
}

function HeaderStatus({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-campaign-panel-soft px-2 py-2 text-campaign-purple-strong">
      {icon}
      <span className="text-xs font-black">{label}</span>
      <span className="max-w-24 truncate text-[0.7rem] font-semibold text-campaign-muted sm:max-w-32">
        {value}
      </span>
    </div>
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
    <CampaignPanel className="p-4 sm:p-5" tone="cyan">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <UserRound className="size-4" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-normal text-campaign-magenta">
            Participant board
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black leading-tight text-campaign-purple-strong">
          Who are you?
        </h2>
        <p className="mt-1 text-sm font-semibold text-campaign-muted">
          Choose your name to personalize the shared board on this device.
        </p>
      </div>
      <div className="mt-4">
        {selectedParticipantName && !isChoosing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CampaignPill tone="yellow">Viewing as</CampaignPill>
              <p className="font-black text-campaign-purple-strong">
                {selectedParticipantName}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onSwitchParticipant}>
              Switch
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[minmax(24rem,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <Label
                htmlFor="participant-identity"
                className="font-black text-campaign-purple-strong"
              >
                Your name
              </Label>
              <select
                id="participant-identity"
                className="h-11 w-full min-w-0 rounded-2xl border-2 border-campaign-ring bg-white px-3 text-sm font-semibold text-campaign-ink outline-none focus:border-campaign-purple"
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
      </div>
    </CampaignPanel>
  );
}
