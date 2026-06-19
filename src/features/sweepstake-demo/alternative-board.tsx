"use client";

import { Bell, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

import {
  CampaignHeader,
  CampaignHeading,
  CampaignLogoMark,
  CampaignPageStack,
  CampaignPanel,
  CampaignShell,
} from "@/components/campaign";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type AlternativeTeamBoardRow,
  buildAlternativeBadgeRows,
  buildAlternativeTeamBoardRows,
} from "@/features/shared-board/alternative-board-data";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";
import type { LeaderboardMovementMap } from "@/server/shared-board/leaderboard-snapshot-movement";

import { SharedScoreboard } from "./shared-scoreboard";

const headerCellClassName =
  "min-w-0 bg-campaign-muted px-1 py-2 text-left text-xs font-black text-white lg:px-2 lg:text-sm";
const stickyColumnHeaderClassName = "sticky top-11 z-30 shadow-sm";
const teamsGridClassName =
  "grid w-full min-w-0 grid-cols-[3.25rem_minmax(0,1.15fr)_minmax(0,1fr)_2rem_2rem_2rem_2.5rem_2.5rem_2.5rem_3.75rem_minmax(0,0.8fr)_minmax(0,1.5fr)] lg:grid-cols-[4rem_minmax(0,1.2fr)_minmax(0,1fr)_2.5rem_2.5rem_2.5rem_3rem_3rem_3rem_4.5rem_minmax(0,0.8fr)_minmax(0,1.5fr)]";

export function AlternativeBoard({
  boardData,
  initialTab = "participants",
  officialMovementByParticipantId,
}: {
  boardData: SharedBoardData;
  initialTab?:
    | "participants"
    | "teams"
    | "badges"
    | "matches"
    | "stats"
    | "explainer";
  officialMovementByParticipantId?: LeaderboardMovementMap;
}) {
  const leadingParticipant = boardData.standings[0];
  const leadingTeamRow = buildAlternativeTeamBoardRows(boardData)[0];
  const heroLeaderLabel = leadingTeamRow
    ? formatAlternativeTeamLeaderLabel(leadingTeamRow)
    : undefined;

  return (
    <CampaignShell className="overflow-x-clip">
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
              <HeaderMetric
                icon={<UsersRound className="size-5" aria-hidden="true" />}
                label="Players"
                value={`${boardData.participants.length}`}
              />
              <HeaderMetric
                icon={<ShieldCheck className="size-5" aria-hidden="true" />}
                label="Teams"
                value={`${boardData.teams.length}`}
              />
              <HeaderMetric
                icon={<Bell className="size-5" aria-hidden="true" />}
                label="Last Updated"
                value={formatHeaderFreshnessLabel(
                  boardData.syncState.freshnessLabel,
                )}
              />
            </div>
          }
        >
          <CampaignHeading eyebrow="Shared sweepstake board · v2.0">
            {boardData.sweepstakeName || "Untitled sweepstake"}
          </CampaignHeading>
        </CampaignHeader>

        <SharedScoreboard
          boardData={boardData}
          defaultTab={initialTab}
          leadingParticipant={leadingParticipant}
          officialMovementByParticipantId={officialMovementByParticipantId}
          showParticipantsHeader
          stickyBoardControls
          badgesContent={<AlternativeBadgesPanel boardData={boardData} />}
          explainerContent={<AlternativeExplainerPanel />}
          heroLeaderLabel={heroLeaderLabel}
          teamsContent={<TeamsTable boardData={boardData} />}
        />
      </CampaignPageStack>
    </CampaignShell>
  );
}

function formatAlternativeTeamLeaderLabel({
  ownerName,
  teamName,
}: {
  ownerName: string;
  teamName: string;
}) {
  return `${ownerName || "Unallocated"} (${teamName})`;
}

function formatHeaderFreshnessLabel(freshnessLabel: string) {
  return freshnessLabel
    .replace(/^Checked\s+/, "")
    .replace(/\s+(?:BST|GMT|UTC)$/, "");
}

const alternativeScoringRows = [
  ["Group only", "group points (Win = 3, Draw = 1, Loss = 0)"],
  ["Reach Round of 16", "group points + 10 pts"],
  ["Reach quarter-final", "group points + 16 pts"],
  ["Reach semi-final", "group points + 24 pts"],
  ["Runner-up", "group points + 30 pts"],
  ["Winner", "group points + 100 pts"],
] as const;

function AlternativeExplainerPanel() {
  return (
    <CampaignPanel className="overflow-hidden p-0">
      <div className="bg-campaign-purple px-4 py-5 text-white sm:px-6">
        <p className="text-xs font-black uppercase tracking-normal">
          Explainer
        </p>
        <h3 className="mt-1 text-2xl font-black">How scoring works</h3>
        <p className="mt-1 text-sm font-semibold text-white/85">
          Each team gets group points, plus one stage bonus based on the
          furthest stage reached.
        </p>
      </div>

      <div className="divide-y divide-campaign-ring">
        {alternativeScoringRows.map(([label, points]) => (
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
            key={label}
          >
            <span className="text-sm font-semibold text-campaign-muted">
              {label}
            </span>
            <span className="min-w-0 break-words text-right font-black text-campaign-purple-strong">
              {points}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 bg-campaign-yellow/35 px-4 py-5 sm:px-6">
        <p className="text-sm font-semibold text-campaign-ink">
          Stage bonuses are not cumulative.
        </p>
        <p className="text-sm font-semibold text-campaign-ink">
          The Teams tab shows every allocated team separately, with its owner,
          wins, draws, losses, goals for, goals against, goal difference,
          points, status and next fixture.
        </p>
        <p className="text-sm font-semibold text-campaign-ink">
          Teams are ranked by points first. If teams are level, the board
          separates them by tournament progress, wins, goal difference, goals
          scored, goals conceded, then team name.
        </p>
        <p className="text-sm font-semibold text-campaign-ink">
          The Participants tab shows everyone's current sweepstake position and
          allocated teams.
        </p>
        <p className="text-sm font-semibold text-campaign-ink">
          Badges on this board are awarded by team performance and shown as
          Participant Name (Team Name).
        </p>
        <p className="font-black text-campaign-purple-strong">
          No predictions. No football knowledge needed. Just follow your teams.
        </p>
      </div>
    </CampaignPanel>
  );
}

function AlternativeBadgesPanel({ boardData }: { boardData: SharedBoardData }) {
  const badges = buildAlternativeBadgeRows(boardData);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {badges.map((badge) => (
        <div key={badge.id} className="rounded-2xl bg-campaign-page p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-campaign-purple-strong">
                {badge.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-campaign-muted">
                {badge.supportLine}
              </p>
            </div>
            <Badge
              variant={badge.status === "manual-future" ? "outline" : "secondary"}
            >
              {badge.status}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {badge.holderLabels.length > 0 ? (
              badge.holderLabels.map((holder) => (
                <Badge key={`${badge.id}-${holder}`}>{holder}</Badge>
              ))
            ) : (
              <Badge variant="outline">No holder yet</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamsHeader({ sticky = false }: { sticky?: boolean }) {
  return (
    <div
      className={`hidden md:block ${sticky ? stickyColumnHeaderClassName : ""}`}
      data-testid="teams-column-header"
    >
      <HeaderGrid className={teamsGridClassName}>
        <HeaderCell>Rank</HeaderCell>
        <HeaderCell>Team</HeaderCell>
        <HeaderCell>Owner</HeaderCell>
        <HeaderCell align="right">
          <FootballAbbreviation label="W" description="Wins" />
        </HeaderCell>
        <HeaderCell align="right">
          <FootballAbbreviation label="D" description="Draws" />
        </HeaderCell>
        <HeaderCell align="right">
          <FootballAbbreviation label="L" description="Losses" />
        </HeaderCell>
        <HeaderCell align="right">
          <FootballAbbreviation label="GF" description="Goals For" />
        </HeaderCell>
        <HeaderCell align="right">
          <FootballAbbreviation label="GA" description="Goals Against" />
        </HeaderCell>
        <HeaderCell align="right">
          <FootballAbbreviation label="GD" description="Goal Difference" />
        </HeaderCell>
        <HeaderCell align="right">Points</HeaderCell>
        <HeaderCell>Stage</HeaderCell>
        <HeaderCell>Next fixture</HeaderCell>
      </HeaderGrid>
    </div>
  );
}

function HeaderGrid({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={`${className} border-t border-campaign-lavender`}
      role="row"
    >
      {children}
    </div>
  );
}

function HeaderCell({
  align,
  children,
}: {
  align?: "right";
  children: ReactNode;
}) {
  return (
    <div
      className={`${headerCellClassName} ${
        align === "right" ? "text-right" : ""
      }`}
      role="columnheader"
    >
      {children}
    </div>
  );
}

function TeamsTable({ boardData }: { boardData: SharedBoardData }) {
  const rows = buildAlternativeTeamBoardRows(boardData);

  return (
    <TableFrame>
      <div className="grid gap-3 md:hidden" data-testid="teams-mobile-list">
        {rows.map((row, index) => (
          <MobileTeamCard
            key={row.teamId}
            isLeader={index === 0}
            row={row}
          />
        ))}
      </div>
      <TeamsHeader sticky />
      <div
        className="hidden md:block"
        data-testid="teams-row-scroll"
      >
        {rows.map((row, index) => (
          <GridRow
            key={row.teamId}
            className={`${teamsGridClassName} ${
              index === 0 ? "bg-campaign-blush" : ""
            }`}
          >
            <RankCell centered rank={row.rank} isLeader={index === 0} />
            <TextCell strong>{row.teamName}</TextCell>
            <TextCell>{row.ownerName}</TextCell>
            <NumericCell centered value={row.wins} />
            <NumericCell centered value={row.draws} />
            <NumericCell centered value={row.losses} />
            <NumericCell centered value={row.goalsFor} />
            <NumericCell centered value={row.goalsAgainst} />
            <NumericCell centered value={row.goalDifference} />
            <ScoreCell centered value={row.points} />
            <TextCell>{formatStatusLabel(row.status)}</TextCell>
            <TextCell>{row.nextFixture}</TextCell>
          </GridRow>
        ))}
      </div>
    </TableFrame>
  );
}

function MobileTeamCard({
  isLeader,
  row,
}: {
  isLeader: boolean;
  row: AlternativeTeamBoardRow;
}) {
  return (
    <article
      className={`rounded-2xl p-3 ${
        isLeader ? "bg-campaign-blush" : "bg-campaign-page"
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${
            isLeader ? "bg-campaign-magenta" : "bg-campaign-purple"
          }`}
        >
          #{row.rank}
        </div>
        <div className="min-w-0">
          <h3 className="break-words font-black leading-tight text-campaign-ink">
            {row.teamName}
          </h3>
          <p className="mt-1 break-words text-xs font-semibold text-campaign-muted">
            {row.ownerName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black leading-none text-campaign-purple-strong">
            {row.points}
          </p>
          <p className="mt-1 text-xs font-black uppercase text-campaign-magenta">
            Pts
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MobileTeamMetric label="W" value={row.wins} />
        <MobileTeamMetric label="D" value={row.draws} />
        <MobileTeamMetric label="L" value={row.losses} />
        <MobileTeamMetric label="GF" value={row.goalsFor} />
        <MobileTeamMetric label="GA" value={row.goalsAgainst} />
        <MobileTeamMetric label="GD" value={row.goalDifference} />
      </div>

      <div className="mt-3 grid gap-2">
        <MobileTeamDetail label="Stage" value={formatStatusLabel(row.status)} />
        <MobileTeamDetail label="Next fixture" value={row.nextFixture} />
      </div>
    </article>
  );
}

function MobileTeamMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-center">
      <p className="text-xs font-black uppercase text-campaign-magenta">
        {label}
      </p>
      <p className="mt-1 font-black text-campaign-purple-strong">{value}</p>
    </div>
  );
}

function MobileTeamDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-xs font-black uppercase text-campaign-magenta">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-campaign-ink">
        {value}
      </p>
    </div>
  );
}

function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-visible rounded-2xl bg-campaign-panel-soft">
      {children}
    </div>
  );
}

function GridRow({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={`${className} border-b border-campaign-ring transition-colors`}
      role="row"
    >
      {children}
    </div>
  );
}

function RankCell({
  centered = false,
  isLeader,
  rank,
}: {
  centered?: boolean;
  isLeader: boolean;
  rank: number;
}) {
  return (
    <div
      className={`flex items-center px-2 py-2 ${
        centered ? "justify-center" : ""
      }`}
      role="cell"
    >
      <div
        className={`flex size-10 items-center justify-center rounded-full text-sm font-black text-white ${
          isLeader ? "bg-campaign-magenta" : "bg-campaign-purple"
        }`}
      >
        #{rank}
      </div>
    </div>
  );
}

function NumericCell({
  centered = false,
  value,
}: {
  centered?: boolean;
  value: number;
}) {
  return (
    <div
      className={`flex items-center px-2 py-2 font-semibold ${
        centered ? "justify-center text-center" : "justify-end text-right"
      }`}
      role="cell"
    >
      {value}
    </div>
  );
}

function ScoreCell({
  centered = false,
  value,
}: {
  centered?: boolean;
  value: number | string;
}) {
  return (
    <div
      className={`flex items-center px-2 py-2 text-xl font-black text-campaign-purple-strong ${
        centered ? "justify-center text-center" : "justify-end text-right"
      }`}
      role="cell"
    >
      {value}
    </div>
  );
}

function TextCell({
  centered = false,
  children,
  strong = false,
}: {
  centered?: boolean;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 px-2 py-2 ${
        centered ? "items-center justify-center text-center" : "items-center"
      } ${
        strong ? "font-black text-campaign-ink" : ""
      }`}
      role="cell"
    >
      <span className="whitespace-normal break-words">{children}</span>
    </div>
  );
}

function FootballAbbreviation({
  description,
  label,
}: {
  description: string;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={`${label}: ${description}`}
          className="cursor-help font-black text-white underline decoration-white/50 decoration-dotted underline-offset-4"
          title={`${label} = ${description}`}
          type="button"
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label} = {description}
      </TooltipContent>
    </Tooltip>
  );
}

function formatStatusLabel(status: string) {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function HeaderMetric({
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
      <span className="max-w-28 truncate text-[0.7rem] font-semibold text-campaign-muted sm:max-w-40">
        {value}
      </span>
    </div>
  );
}
