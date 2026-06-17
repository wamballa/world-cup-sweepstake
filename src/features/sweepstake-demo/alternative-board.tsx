import { BarChart3, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

import {
  CampaignHeader,
  CampaignHeading,
  CampaignLogoMark,
  CampaignMetric,
  CampaignPageStack,
  CampaignPanel,
  CampaignPill,
  CampaignShell,
} from "@/components/campaign";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildAlternativeBoardRows,
  buildAlternativeTeamBoardRows,
} from "@/features/shared-board/alternative-board-data";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

const stickyControlClassName =
  "sticky top-0 z-40 overflow-hidden rounded-2xl bg-campaign-lavender/95 shadow-sm backdrop-blur";
const headerCellClassName =
  "bg-campaign-muted px-2 py-3 text-left text-sm font-black text-white";
const alternativeBoardTabTriggerClassName =
  "h-9 rounded-xl border-transparent px-2 py-0 font-black leading-none !text-campaign-purple/65 outline-none hover:!text-campaign-purple focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none data-active:!border-transparent data-active:!bg-transparent data-active:!text-campaign-purple-strong data-active:!shadow-none data-[state=active]:!border-transparent data-[state=active]:!bg-transparent data-[state=active]:!text-campaign-purple-strong data-[state=active]:!shadow-none";
const luckGridClassName =
  "grid min-w-[56rem] grid-cols-[5rem_7rem_minmax(14rem,1.2fr)_minmax(18rem,2fr)_6rem_8rem]";
const fairPlayGridClassName =
  "grid min-w-[64rem] grid-cols-[5rem_7rem_minmax(14rem,1.2fr)_minmax(18rem,2fr)_8rem_6rem_9rem]";
const teamsGridClassName =
  "grid min-w-[58rem] grid-cols-[5rem_minmax(12rem,1.1fr)_minmax(13rem,1.1fr)_3rem_3rem_3rem_4rem_4rem_4rem_6rem_8rem]";

export function AlternativeBoard({
  boardData,
  officialMovementByParticipantId = {},
  alternativeMovementByParticipantId = {},
  initialTab = "luck",
}: {
  boardData: SharedBoardData;
  officialMovementByParticipantId?: Record<string, string>;
  alternativeMovementByParticipantId?: Record<string, string>;
  initialTab?: "luck" | "fair" | "teams";
}) {
  const fairPlayRows = buildAlternativeBoardRows(boardData);
  const leader = fairPlayRows[0];
  const topScore = leader?.displayAlternativeScore ?? "0";
  const topTiedPlayerCount = fairPlayRows.filter((row) => row.rank === 1).length;

  return (
    <CampaignShell className="overflow-x-visible">
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
                icon={<BarChart3 className="size-5" aria-hidden="true" />}
                label="Views"
                value="3 tabs"
              />
            </div>
          }
        >
          <CampaignHeading eyebrow="Experimental comparison board">
            Alternative Board
          </CampaignHeading>
        </CampaignHeader>

        <CampaignPanel className="relative overflow-hidden p-5 sm:p-6" tone="magenta">
          <div className="absolute -right-12 -top-14 size-36 rounded-full bg-campaign-yellow" />
          <div className="absolute -bottom-14 left-16 size-32 rounded-full bg-campaign-cyan/80" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-end">
            <div className="min-w-0">
              <Badge className="bg-white text-campaign-purple hover:bg-white">
                Alternative Board
              </Badge>
              <h2 className="mt-3 text-4xl font-black leading-none text-white sm:text-5xl">
                Hidden comparison board
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold text-white/90 sm:text-base">
                This is an experimental alternative board. The official
                leaderboard remains the Luck of the Draw table. Use these tabs
                to compare total score, average score per assigned team, and
                individual team performance.
              </p>
              <p className="mt-1 max-w-2xl text-xs font-semibold text-white/80 sm:text-sm">
                Cached tournament data. {boardData.syncState.freshnessLabel}.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1.5fr)_1fr_1fr]">
              <HeroMetric label="Top score" value={topScore} />
              <HeroMetric
                label="Players tied"
                value={`${topTiedPlayerCount}`}
              />
              <HeroMetric label="Players" value={`${fairPlayRows.length}`} />
            </div>
          </div>
        </CampaignPanel>

        <CampaignPanel className="space-y-4 p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <CampaignMetric
              label="Scoring"
              value="Comparison"
              tone="yellow"
            />
            <CampaignMetric
              label="Official board"
              value="Unchanged"
              tone="cyan"
            />
            <CampaignMetric
              label="Status"
              value="Hidden"
              tone="pink"
            />
          </div>

          <Tabs defaultValue={initialTab} className="gap-4">
            <TabsContent value="luck">
              <StickyBoardControls header={<LuckHeader />} />
              <LuckOfTheDrawTable
                boardData={boardData}
                movementByParticipantId={officialMovementByParticipantId}
              />
            </TabsContent>
            <TabsContent value="fair">
              <StickyBoardControls header={<FairPlayHeader />} />
              <FairPlayTable
                boardData={boardData}
                movementByParticipantId={alternativeMovementByParticipantId}
              />
            </TabsContent>
            <TabsContent value="teams">
              <StickyBoardControls header={<TeamsHeader />} />
              <TeamsTable boardData={boardData} />
            </TabsContent>
          </Tabs>

          <p className="text-xs font-semibold text-campaign-muted">
            Alternative score = total official score of valid assigned teams
            divided by number of valid assigned teams. The official Luck of the
            Draw leaderboard remains unchanged.
          </p>
        </CampaignPanel>
      </CampaignPageStack>
    </CampaignShell>
  );
}

function StickyBoardControls({ header }: { header: ReactNode }) {
  return (
    <div className={stickyControlClassName} data-testid="sticky-board-controls">
      <TabsList className="grid h-auto w-full grid-cols-3 rounded-none bg-campaign-lavender/95 p-1">
        <TabsTrigger
          value="luck"
          className={alternativeBoardTabTriggerClassName}
        >
          Luck of the Draw
        </TabsTrigger>
        <TabsTrigger
          value="fair"
          className={alternativeBoardTabTriggerClassName}
        >
          Fair Play
        </TabsTrigger>
        <TabsTrigger
          value="teams"
          className={alternativeBoardTabTriggerClassName}
        >
          Teams
        </TabsTrigger>
      </TabsList>
      <div className="overflow-x-auto">{header}</div>
    </div>
  );
}

function LuckHeader() {
  return (
    <HeaderGrid className={luckGridClassName}>
      <HeaderCell>Rank</HeaderCell>
      <HeaderCell>Change</HeaderCell>
      <HeaderCell>Participant</HeaderCell>
      <HeaderCell>Assigned teams</HeaderCell>
      <HeaderCell align="right">Teams</HeaderCell>
      <HeaderCell align="right">Total points</HeaderCell>
    </HeaderGrid>
  );
}

function FairPlayHeader() {
  return (
    <HeaderGrid className={fairPlayGridClassName}>
      <HeaderCell>Rank</HeaderCell>
      <HeaderCell>Change</HeaderCell>
      <HeaderCell>Participant</HeaderCell>
      <HeaderCell>Assigned teams</HeaderCell>
      <HeaderCell align="right">Total points</HeaderCell>
      <HeaderCell align="right">Teams</HeaderCell>
      <HeaderCell align="right">Average points</HeaderCell>
    </HeaderGrid>
  );
}

function TeamsHeader() {
  return (
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
      <HeaderCell>Stage/status</HeaderCell>
    </HeaderGrid>
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
    <div className={`${className} border-t border-campaign-lavender`} role="row">
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

function LuckOfTheDrawTable({
  boardData,
  movementByParticipantId,
}: {
  boardData: SharedBoardData;
  movementByParticipantId: Record<string, string>;
}) {
  return (
    <TableFrame>
      {boardData.standings.map((standing, index) => (
        <GridRow
          key={standing.participantId}
          className={`${luckGridClassName} ${
            index === 0 ? "bg-campaign-blush" : ""
          }`}
        >
          <RankCell rank={standing.rank} isLeader={index === 0} />
          <ChangeCell value={movementByParticipantId[standing.participantId]} />
          <TextCell strong>{standing.name}</TextCell>
          <TeamsCell
            participantId={standing.participantId}
            teamIds={standing.teamIds}
            teamNames={standing.teamNames}
          />
          <NumericCell value={standing.teamCount} />
          <ScoreCell value={standing.points} />
        </GridRow>
      ))}
    </TableFrame>
  );
}

function FairPlayTable({
  boardData,
  movementByParticipantId,
}: {
  boardData: SharedBoardData;
  movementByParticipantId: Record<string, string>;
}) {
  const rows = buildAlternativeBoardRows(boardData);

  return (
    <TableFrame>
      {rows.map((row, index) => (
        <GridRow
          key={row.participantId}
          className={`${fairPlayGridClassName} ${
            index === 0 ? "bg-campaign-blush" : ""
          }`}
        >
          <RankCell rank={row.rank} isLeader={index === 0} />
          <ChangeCell value={movementByParticipantId[row.participantId]} />
          <TextCell strong>{row.name}</TextCell>
          <TeamsCell
            participantId={row.participantId}
            teamIds={row.teamIds}
            teamNames={row.teamNames}
          />
          <NumericCell value={row.totalOfficialTeamScore} />
          <NumericCell value={row.assignedTeamCount} />
          <ScoreCell value={row.displayAlternativeScore} />
        </GridRow>
      ))}
    </TableFrame>
  );
}

function TeamsTable({ boardData }: { boardData: SharedBoardData }) {
  const rows = buildAlternativeTeamBoardRows(boardData);

  return (
    <TableFrame>
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
        </GridRow>
      ))}
    </TableFrame>
  );
}

function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto bg-campaign-panel-soft">
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
      className={`flex px-2 py-3 ${centered ? "items-center justify-center" : ""}`}
      role="cell"
    >
      <div
        className={`flex size-11 items-center justify-center rounded-full text-sm font-black text-white ${
          isLeader ? "bg-campaign-magenta" : "bg-campaign-purple"
        }`}
      >
        #{rank}
      </div>
    </div>
  );
}

function ChangeCell({ value }: { value?: string }) {
  return (
    <div
      className="px-2 py-3 font-black text-campaign-purple-strong"
      role="cell"
    >
      {value ?? "-"}
    </div>
  );
}

function TeamsCell({
  participantId,
  teamIds,
  teamNames,
}: {
  participantId: string;
  teamIds: string[];
  teamNames: string[];
}) {
  return (
    <div className="px-2 py-3" role="cell">
      <div className="flex flex-wrap gap-1.5">
        {teamNames.length > 0 ? (
          teamNames.map((teamName, teamIndex) => (
            <Badge
              key={`${participantId}-${teamIds[teamIndex] ?? teamIndex}`}
              className="max-w-full truncate bg-white text-campaign-muted hover:bg-white"
            >
              {teamName}
            </Badge>
          ))
        ) : (
          <CampaignPill tone="soft">No valid teams</CampaignPill>
        )}
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
      className={`flex px-2 py-3 font-semibold ${
        centered ? "items-center justify-center text-center" : "justify-end text-right"
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
      className={`flex px-2 py-3 text-xl font-black text-campaign-purple-strong ${
        centered ? "items-center justify-center text-center" : "justify-end text-right"
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
      className={`flex min-w-0 px-2 py-3 ${
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
    <span
      aria-label={`${label}: ${description}`}
      className="cursor-help font-black text-white underline decoration-white/50 decoration-dotted underline-offset-4"
      role="note"
      title={`${label} = ${description}`}
    >
      {label}
    </span>
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
      <span className="max-w-24 truncate text-[0.7rem] font-semibold text-campaign-muted sm:max-w-32">
        {value}
      </span>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-4 py-3 text-campaign-ink">
      <p className="text-xs font-black uppercase text-campaign-magenta">
        {label}
      </p>
      <p className="mt-1 whitespace-normal break-words text-xl font-black leading-tight text-campaign-purple-strong">
        {value}
      </p>
    </div>
  );
}
