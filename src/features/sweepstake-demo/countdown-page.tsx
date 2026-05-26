"use client";

import { CalendarDays, Trophy, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  CampaignHeader,
  CampaignHeading,
  CampaignLogoMark,
  CampaignMetric,
  CampaignPageStack,
  CampaignPanel,
  CampaignPill,
  CampaignSectionHeading,
  CampaignShell,
} from "@/components/campaign";
import { Badge } from "@/components/ui/badge";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";
import {
  buildCountdownAllocations,
  buildCountdownParticipantAllocations,
  getTournamentCountdownTarget,
} from "@/features/shared-board/countdown-page-data";

type CountdownPart = {
  label: string;
  value: string;
};

export function CountdownPage({
  boardData,
}: {
  boardData: SharedBoardData;
}) {
  const countdownTarget = useMemo(
    () => getTournamentCountdownTarget(boardData),
    [boardData],
  );
  const countdownParts = useCountdownParts(countdownTarget);
  const participantAllocations = useMemo(
    () => buildCountdownParticipantAllocations(boardData),
    [boardData],
  );
  const cachedMatchCount = boardData.matches.length;

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
              <CampaignMetric
                className="px-3 py-2"
                label="Players"
                value={`${boardData.participants.length}`}
              />
              <CampaignMetric
                className="px-3 py-2"
                label="Teams"
                tone="cyan"
                value={`${boardData.teams.length}`}
              />
              <CampaignMetric
                className="px-3 py-2"
                label="Matches"
                tone="yellow"
                value={`${cachedMatchCount}`}
              />
            </div>
          }
        >
          <CampaignHeading eyebrow="Countdown page">
            {boardData.sweepstakeName || "Untitled sweepstake"}
          </CampaignHeading>
        </CampaignHeader>

        <CampaignPanel className="p-5 sm:p-7" tone="purple">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end">
            <div className="min-w-0">
              <Badge className="bg-white text-campaign-purple hover:bg-white">
                Tournament start
              </Badge>
              <h2 className="mt-4 text-5xl font-black leading-none text-white sm:text-7xl">
                World Cup 2026 draw is live. The countdown is on.
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <CampaignPill tone="yellow">
                  {countdownTarget ? formatTargetDate(countdownTarget) : "Kickoff TBC"}
                </CampaignPill>
                <CampaignPill className="text-white" tone="magenta">
                  {boardData.syncState.freshnessLabel}
                </CampaignPill>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {countdownParts.map((part) => (
                <div
                  key={part.label}
                  className="rounded-3xl bg-white px-4 py-5 text-center text-campaign-purple-strong"
                >
                  <p className="text-4xl font-black leading-none sm:text-5xl">
                    {part.value}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase text-campaign-magenta">
                    {part.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CampaignPanel>

        <CampaignPanel className="p-4 sm:p-5" tone="cyan">
          <CampaignSectionHeading
            eyebrow="Allocations"
            icon={<Trophy className="size-5" aria-hidden="true" />}
          >
            Players and first-match watchlist
          </CampaignSectionHeading>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {participantAllocations.map((participantAllocation) => (
              <ParticipantAllocationCountdownCard
                participantAllocation={participantAllocation}
                key={participantAllocation.participantId}
              />
            ))}
          </div>
        </CampaignPanel>
      </CampaignPageStack>
    </CampaignShell>
  );
}

function ParticipantAllocationCountdownCard({
  participantAllocation,
}: {
  participantAllocation: ReturnType<
    typeof buildCountdownParticipantAllocations
  >[number];
}) {
  return (
    <div className="rounded-3xl bg-white p-4 text-campaign-ink shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-black text-campaign-purple-strong">
            {participantAllocation.participantName}
          </p>
          <p className="mt-1 text-sm font-semibold text-campaign-muted">
            {participantAllocation.teams.length}{" "}
            {participantAllocation.teams.length === 1 ? "country" : "countries"}
          </p>
        </div>
        <UsersRound
          className="size-8 shrink-0 text-campaign-magenta"
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 space-y-3">
        {participantAllocation.teams.map((team) => (
          <TeamFirstMatchBlock
            key={team.teamId}
            participantName={participantAllocation.participantName}
            team={team}
          />
        ))}
      </div>
    </div>
  );
}

function TeamFirstMatchBlock({
  participantName,
  team,
}: {
  participantName: string;
  team: ReturnType<typeof buildCountdownAllocations>[number];
}) {
  const firstMatch = team.firstMatch;

  return (
    <div className="rounded-2xl bg-campaign-page p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto min-w-0 truncate text-lg font-black text-campaign-purple-strong">
          {team.teamName}
        </p>
        <TeamFlagBadge team={team} />
      </div>
      <div className="mt-3 grid gap-2">
        <MatchSignal
          icon={<CalendarDays className="size-4" aria-hidden="true" />}
          label="First match"
          value={firstMatch?.kickoffLabel ?? "Kickoff TBC"}
        />
        <MatchSignal
          icon={<Trophy className="size-4" aria-hidden="true" />}
          label="Opponent"
          value={firstMatch ? `v ${firstMatch.opponentTeamName}` : "Opponent TBC"}
        />
        <MatchSignal
          icon={<UsersRound className="size-4" aria-hidden="true" />}
          label="Sweepstake matchup"
          value={
            firstMatch
              ? firstMatch.opponentParticipantName
                ? `${participantName} v ${firstMatch.opponentParticipantName}`
                : `${participantName} v TBC`
              : "Participants TBC"
          }
        />
      </div>
    </div>
  );
}

function TeamFlagBadge({
  team,
}: {
  team: ReturnType<typeof buildCountdownAllocations>[number];
}) {
  if (!team.flagAssetPath) {
    return (
      <CampaignPill className="text-white" tone="purple">
        {team.teamShortName}
      </CampaignPill>
    );
  }

  return (
    <div
      aria-label={`${team.teamName} flag, ${team.teamShortName}`}
      className="h-9 w-14 shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-sm"
      role="img"
    >
      <span
        className="block size-full bg-cover bg-center"
        style={{ backgroundImage: `url(${team.flagAssetPath})` }}
      />
    </div>
  );
}

function MatchSignal({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-campaign-panel-soft p-3">
      <div className="mt-0.5 text-campaign-purple">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase text-campaign-magenta">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function useCountdownParts(target: string | null): CountdownPart[] {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setNow(Date.now()));
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
    };
  }, []);

  if (!target || now === null) {
    return [
      { label: "Days", value: "--" },
      { label: "Hours", value: "--" },
      { label: "Mins", value: "--" },
      { label: "Secs", value: "--" },
    ];
  }

  const distance = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  const seconds = Math.floor((distance % 60_000) / 1000);

  return [
    { label: "Days", value: String(days).padStart(2, "0") },
    { label: "Hours", value: String(hours).padStart(2, "0") },
    { label: "Mins", value: String(minutes).padStart(2, "0") },
    { label: "Secs", value: String(seconds).padStart(2, "0") },
  ];
}

function formatTargetDate(target: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeZone: "Europe/London",
    timeStyle: "short",
  }).format(new Date(target));
}
