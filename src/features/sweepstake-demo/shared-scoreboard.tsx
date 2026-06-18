import {
  Bell,
  CalendarDays,
  CircleHelp,
  Gauge,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { CampaignMetric, CampaignPanel } from "@/components/campaign";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type SharedBoardBadge,
  type SharedBoardData,
  type SharedBoardMatch,
  type SharedBoardStanding,
} from "@/features/shared-board/shared-board-data";
import type {
  LeaderboardMovementDisplay,
  LeaderboardMovementMap,
} from "@/server/shared-board/leaderboard-snapshot-movement";

import {
  formatMatchStatus,
  formatStatus,
  StatusBadge,
} from "./demo-primitives";

const sharedBoardTabTriggerClassName =
  "h-8 rounded-xl px-1 py-0 font-black leading-none !text-campaign-purple/65 hover:!text-campaign-purple data-active:!bg-transparent data-active:!text-campaign-purple-strong data-active:!shadow-none data-[state=active]:!bg-transparent data-[state=active]:!text-campaign-purple-strong data-[state=active]:!shadow-none [&_span]:text-inherit [&_span]:leading-none [&_svg]:text-current";

const sharedBoardTableHeadClassName =
  "bg-campaign-muted font-black text-white hover:bg-campaign-muted hover:text-white";
const sharedBoardGridHeadClassName =
  "bg-campaign-muted px-2 py-2 text-left text-sm font-black text-white";
const stickyBoardTabsClassName =
  "sticky top-0 z-40 shadow-sm backdrop-blur";
const stickyBoardHeaderClassName =
  "sticky top-11 z-30 shadow-sm";
const matchesGridClassName =
  "grid w-full min-w-0 grid-cols-[minmax(0,1.35fr)_minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(7rem,0.8fr)_minmax(4rem,0.45fr)]";

export type SharedScoreboardExtraTab = {
  value: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

export function SharedScoreboard({
  selectedParticipantId,
  boardData,
  leadingParticipant,
  defaultTab = "participants",
  extraTabsAfterParticipants = [],
  badgesContent,
  explainerContent,
  heroLeaderLabel,
  officialMovementByParticipantId,
  showParticipantsHeader = false,
  stickyBoardControls = false,
  teamsContent,
}: {
  selectedParticipantId?: string | null;
  boardData: SharedBoardData;
  leadingParticipant?: SharedBoardStanding;
  defaultTab?: string;
  extraTabsAfterParticipants?: SharedScoreboardExtraTab[];
  badgesContent?: ReactNode;
  explainerContent?: ReactNode;
  heroLeaderLabel?: string;
  officialMovementByParticipantId?: LeaderboardMovementMap;
  showParticipantsHeader?: boolean;
  stickyBoardControls?: boolean;
  teamsContent?: ReactNode;
}) {
  const standings = boardData.standings;
  const hasStarted = boardData.summary.hasFinalMatches;
  const tabCount = 6 + extraTabsAfterParticipants.length;

  return (
    <section
      aria-label={boardData.sweepstakeName || "Untitled sweepstake"}
      className="space-y-3"
    >
      <CampaignPanel
        className="relative overflow-hidden p-5 sm:p-6"
        tone="magenta"
      >
        <div className="absolute -right-12 -top-14 size-36 rounded-full bg-campaign-yellow" />
        <div className="absolute -bottom-14 left-16 size-32 rounded-full bg-campaign-cyan/80" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-end">
          <div className="min-w-0">
            <Badge className="bg-white text-campaign-purple hover:bg-white">
              Shared scoreboard
            </Badge>
            <h2 className="mt-3 text-4xl font-black leading-none text-white sm:text-5xl">
              {hasStarted
                ? "Leaderboard, teams, badges, and match updates"
                : "Teams, badges, and match updates"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-white/90 sm:text-base">
              Cached tournament data. {boardData.syncState.freshnessLabel}.
            </p>
            <p className="mt-1 max-w-2xl text-xs font-semibold text-white/80 sm:text-sm">
              {boardData.syncState.freshnessNotice}
            </p>
          </div>
          <HeroSummaryMetrics
            boardData={boardData}
            heroLeaderLabel={heroLeaderLabel}
            leadingParticipant={leadingParticipant}
          />
        </div>
      </CampaignPanel>

      <CampaignPanel className="p-3 sm:p-4">
        <Tabs
          defaultValue={defaultTab}
          className={stickyBoardControls ? "gap-0" : "gap-4"}
        >
          <TabsList
            className={`grid h-auto w-full rounded-2xl bg-campaign-lavender/40 p-1 ${
              stickyBoardControls ? stickyBoardTabsClassName : ""
            }`}
            data-testid="shared-scoreboard-tabs"
            style={{
              gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))`,
            }}
          >
            <SharedScoreboardTabTrigger
              value="participants"
              label="Participants"
              icon={<UsersRound className="size-4" aria-hidden="true" />}
            />
            {extraTabsAfterParticipants.map((tab) => (
              <SharedScoreboardTabTrigger
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={tab.icon}
              />
            ))}
            <SharedScoreboardTabTrigger
              value="teams"
              label="Teams"
              icon={<ShieldCheck className="size-4" aria-hidden="true" />}
            />
            <SharedScoreboardTabTrigger
              value="badges"
              label="Badges"
              icon={<Medal className="size-4" aria-hidden="true" />}
            />
            <SharedScoreboardTabTrigger
              value="matches"
              label="Matches"
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
            />
            <SharedScoreboardTabTrigger
              value="stats"
              label="Stats"
              icon={<Gauge className="size-4" aria-hidden="true" />}
            />
            <SharedScoreboardTabTrigger
              value="explainer"
              label="Explainer"
              icon={<CircleHelp className="size-4" aria-hidden="true" />}
            />
          </TabsList>

          <TabsContent
            value="participants"
            className={stickyBoardControls ? "pt-3" : undefined}
          >
            <ParticipantsPanel
              selectedParticipantId={selectedParticipantId}
              boardData={boardData}
              officialMovementByParticipantId={officialMovementByParticipantId}
              showHeader={showParticipantsHeader}
              stickyHeader={stickyBoardControls}
            />
          </TabsContent>
          {extraTabsAfterParticipants.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
          <TabsContent
            value="teams"
            className={stickyBoardControls ? "pt-3" : undefined}
          >
            {teamsContent ?? <TeamsPanel boardData={boardData} />}
          </TabsContent>
          <TabsContent
            value="badges"
            className={stickyBoardControls ? "pt-3" : undefined}
          >
            {badgesContent ?? (
              <BadgesPanel
                badges={boardData.badges}
                hasFinalMatches={boardData.summary.hasFinalMatches}
                standings={standings}
              />
            )}
          </TabsContent>
          <TabsContent
            value="matches"
            className={stickyBoardControls ? "pt-3" : undefined}
          >
            <MatchesPanel
              matches={boardData.matches}
              stickyHeader={stickyBoardControls}
            />
          </TabsContent>
          <TabsContent value="stats">
            <StatsPanel
              finalMatches={boardData.summary.finalMatchCount}
              totalGoals={boardData.summary.totalGoals}
              activeTeams={boardData.summary.activeTeamCount}
              delayedMatches={boardData.summary.delayedMatchCount}
              scheduledMatches={boardData.summary.scheduledMatchCount}
            />
          </TabsContent>
          <TabsContent value="explainer">
            {explainerContent ?? <ExplainerPanel />}
          </TabsContent>
        </Tabs>
      </CampaignPanel>
    </section>
  );
}

function SharedScoreboardTabTrigger({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={sharedBoardTabTriggerClassName}
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}

function HeroSummaryMetrics({
  boardData,
  heroLeaderLabel,
  leadingParticipant,
}: {
  boardData: SharedBoardData;
  heroLeaderLabel?: string;
  leadingParticipant?: SharedBoardStanding;
}) {
  if (!boardData.summary.hasFinalMatches) {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        <HeroSummaryMetric
          label="Players"
          value={`${boardData.participants.length}`}
        />
        <HeroSummaryMetric label="Teams" value={`${boardData.teams.length}`} />
        <HeroSummaryMetric label="Status" value="Not started" />
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1.5fr)_1fr_1fr]">
      <HeroSummaryMetric
        label="Leader"
        value={
          heroLeaderLabel ??
          leadingParticipant?.name ??
          boardData.summary.leaderName ??
          "-"
        }
      />
      <HeroSummaryMetric
        label="Completed"
        value={`${boardData.summary.finalMatchCount}`}
      />
      <HeroSummaryMetric
        label="Pending"
        value={`${
          boardData.summary.scheduledMatchCount +
          boardData.summary.delayedMatchCount
        }`}
      />
    </div>
  );
}

function HeroSummaryMetric({ label, value }: { label: string; value: string }) {
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

function ParticipantsPanel({
  selectedParticipantId,
  boardData,
  officialMovementByParticipantId,
  showHeader = false,
  stickyHeader = false,
}: {
  selectedParticipantId?: string | null;
  boardData: SharedBoardData;
  officialMovementByParticipantId?: LeaderboardMovementMap;
  showHeader?: boolean;
  stickyHeader?: boolean;
}) {
  const standings = boardData.standings;
  const featuredParticipant = standings.find(
    (standing) => standing.participantId === selectedParticipantId,
  );

  if (showHeader) {
    return (
      <div
        className={`rounded-2xl bg-campaign-panel-soft ${
          stickyHeader ? "overflow-visible" : "overflow-hidden"
        }`}
        data-testid="participants-table-frame"
      >
        <ParticipantsHeader
          showChange={officialMovementByParticipantId !== undefined}
          sticky={stickyHeader}
        />
        {standings.map((standing, index) => (
          <ParticipantStandingRow
            key={standing.participantId}
            change={officialMovementByParticipantId?.[standing.participantId]}
            showChange={officialMovementByParticipantId !== undefined}
            index={index}
            tableLayout
            standing={standing}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-3">
        {standings.map((standing, index) => (
          <ParticipantStandingRow
            key={standing.participantId}
            change={officialMovementByParticipantId?.[standing.participantId]}
            showChange={officialMovementByParticipantId !== undefined}
            index={index}
            standing={standing}
          />
        ))}
      </div>
      <div className="space-y-3">
        {featuredParticipant ? (
          <ParticipantFocusCard
            boardData={boardData}
            hasFinalMatches={boardData.summary.hasFinalMatches}
            standing={featuredParticipant}
          />
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed border-campaign-ring bg-campaign-panel-soft p-4"
            aria-label="Your sweepstake"
          >
            <div className="flex items-center gap-2 text-campaign-purple">
              <UserRound className="size-4" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-normal">
                Your sweepstake
              </span>
            </div>
            <p className="mt-3 text-lg font-black text-campaign-purple-strong">
              Choose your name
            </p>
            <p className="mt-1 text-sm font-semibold text-campaign-muted">
              Pick yourself above to see your teams, points, badges, and
              matches.
            </p>
          </div>
        )}
        <CampaignPanel className="p-4" tone="yellow">
          <div className="flex items-center gap-2 text-campaign-purple">
            <Bell className="size-4" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-normal">
              Updates
            </span>
          </div>
          <p className="mt-3 text-xl font-black text-campaign-purple-strong">
            Email optional
          </p>
          <p className="mt-1 text-sm font-semibold text-campaign-muted">
            No email provider is connected during this phase.
          </p>
        </CampaignPanel>
      </div>
    </div>
  );
}

function ParticipantStandingRow({
  change,
  index,
  showChange,
  standing,
  tableLayout = false,
}: {
  change?: LeaderboardMovementDisplay;
  index: number;
  showChange: boolean;
  standing: SharedBoardStanding;
  tableLayout?: boolean;
}) {
  if (tableLayout) {
    return (
      <motion.div
        className={`grid ${
          showChange
            ? "grid-cols-[3.25rem_minmax(0,1fr)_4.25rem_3rem] sm:grid-cols-[5rem_minmax(0,1fr)_8rem_6rem]"
            : "grid-cols-[3.25rem_minmax(0,1fr)_4.25rem] sm:grid-cols-[5rem_minmax(0,1fr)_8rem]"
        } ${
          index === 0 ? "bg-campaign-blush" : "bg-campaign-page"
        } ${index > 0 ? "border-t border-campaign-ring" : ""}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        role="row"
        transition={{ delay: index * 0.025 }}
      >
        <div className="flex items-center px-1.5 py-3 sm:px-2" role="cell">
          <RankBadge compact index={index} rank={standing.rank} />
        </div>
        <div className="flex min-w-0 items-center px-1.5 py-3 sm:px-2" role="cell">
          <ParticipantSummary standing={standing} />
        </div>
        <div className="px-1.5 py-3 text-right sm:px-2" role="cell">
          <p className="text-xl font-black text-campaign-purple-strong sm:text-2xl">
            {standing.points}
          </p>
          <p className="text-[0.65rem] font-semibold leading-tight text-campaign-muted sm:text-xs">
            {standing.teamCount} teams
          </p>
        </div>
        {showChange ? (
          <div
            className="flex items-center justify-end px-2 py-3 text-right text-sm font-black text-campaign-magenta"
            role="cell"
          >
            {change ?? "-"}
          </div>
        ) : null}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`p-3 ${
        index === 0 ? "bg-campaign-blush" : "bg-campaign-page"
      } ${index > 0 ? "border-t border-campaign-ring" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RankBadge index={index} rank={standing.rank} />
          <ParticipantSummary standing={standing} />
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-campaign-purple-strong">
            {standing.points}
          </p>
          <p className="text-xs font-semibold text-campaign-muted">
            {standing.teamCount} teams
          </p>
          {showChange ? (
            <p className="mt-1 text-xs font-black text-campaign-magenta">
              Change {change ?? "-"}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function RankBadge({
  compact = false,
  index,
  rank,
}: {
  compact?: boolean;
  index: number;
  rank: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${
        compact ? "size-9 sm:size-11" : "size-11"
      } ${
        index === 0 ? "bg-campaign-magenta" : "bg-campaign-purple"
      }`}
    >
      #{rank}
    </div>
  );
}

function ParticipantSummary({ standing }: { standing: SharedBoardStanding }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-black text-campaign-ink">{standing.name}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {standing.teamNames.map((teamName, teamIndex) => (
          <Badge
            key={`${standing.participantId}-${standing.teamIds[teamIndex] ?? teamIndex}`}
            className="max-w-full truncate bg-white text-campaign-muted hover:bg-white"
          >
            {teamName}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ParticipantsHeader({
  showChange,
  sticky,
}: {
  showChange: boolean;
  sticky: boolean;
}) {
  return (
    <div
      className={`grid ${
        showChange
          ? "grid-cols-[3.25rem_minmax(0,1fr)_4.25rem_3rem] sm:grid-cols-[5rem_minmax(0,1fr)_8rem_6rem]"
          : "grid-cols-[3.25rem_minmax(0,1fr)_4.25rem] sm:grid-cols-[5rem_minmax(0,1fr)_8rem]"
      } overflow-hidden rounded-t-2xl ${
        sticky ? stickyBoardHeaderClassName : ""
      }`}
      data-testid="participants-column-header"
      role="row"
    >
      <div
        aria-label="Rank"
        className={sharedBoardGridHeadClassName}
        role="columnheader"
      >
        Rank
      </div>
      <div className={sharedBoardGridHeadClassName} role="columnheader">
        Participant
      </div>
      <div
        aria-label="Total points"
        className={`${sharedBoardGridHeadClassName} text-right`}
        role="columnheader"
      >
        <span className="sm:hidden">Pts</span>
        <span className="hidden sm:inline">Total points</span>
      </div>
      {showChange ? (
        <div
          aria-label="Change"
          className={`${sharedBoardGridHeadClassName} text-right`}
          role="columnheader"
        >
          <span className="sm:hidden">Chg</span>
          <span className="hidden sm:inline">Change</span>
        </div>
      ) : null}
    </div>
  );
}

function ParticipantFocusCard({
  boardData,
  hasFinalMatches,
  standing,
}: {
  boardData: SharedBoardData;
  hasFinalMatches: boolean;
  standing: SharedBoardStanding;
}) {
  const participant = boardData.participants.find(
    (person) => person.id === standing.participantId,
  );
  const allocatedTeams = boardData.teams.filter(
    (team) => team.allocatedTo === standing.participantId,
  );
  const allocatedTeamIds = new Set(allocatedTeams.map((team) => team.id));
  const relevantMatches = boardData.matches.filter(
    (match) =>
      (match.homeTeamId != null && allocatedTeamIds.has(match.homeTeamId)) ||
      (match.awayTeamId != null && allocatedTeamIds.has(match.awayTeamId)),
  );
  const recentMatch = relevantMatches.find((match) => match.status === "final");
  const upcomingMatch = relevantMatches.find(
    (match) => match.status !== "final",
  );
  const earnedBadges = hasFinalMatches
    ? boardData.badges
        .filter((badge) =>
          badge.holderParticipantIds.includes(standing.participantId),
        )
        .map((badge) => badge.label)
    : [];

  return (
    <div
      className="rounded-2xl bg-campaign-cyan p-4"
      aria-label="Your sweepstake"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-campaign-purple">
            <UserRound className="size-4" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-normal">
              Your sweepstake
            </span>
          </div>
          <p className="mt-3 text-xl font-black text-campaign-purple-strong">
            {standing.name}
          </p>
          <p className="mt-1 text-sm font-semibold text-campaign-muted">
            Rank #{standing.rank} with {standing.points} total points.
          </p>
        </div>
        <Badge
          className={
            participant?.emailUpdatesEnabled
              ? "bg-campaign-yellow text-campaign-ink hover:bg-campaign-yellow"
              : "bg-white text-campaign-muted hover:bg-white"
          }
        >
          {participant?.emailUpdatesEnabled
            ? "Email updates on"
            : "No email updates"}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-black uppercase text-campaign-magenta">
            Allocated teams
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allocatedTeams.map((team) => (
              <Badge
                key={team.id}
                className="bg-white text-campaign-purple hover:bg-white"
              >
                {team.shortName}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <ParticipantSignal
            label="Badges"
            value={
              earnedBadges.length > 0
                ? earnedBadges.join(", ")
                : hasFinalMatches
                  ? "No badges yet"
                  : "Badges appear after results are available"
            }
          />
          <ParticipantSignal
            label="Recent match"
            value={
              recentMatch ? formatMatchSummary(recentMatch) : "No recent result"
            }
          />
          <ParticipantSignal
            label="Next match"
            value={
              upcomingMatch
                ? formatMatchSummary(upcomingMatch)
                : "No upcoming match"
            }
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-black uppercase text-campaign-magenta">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-campaign-ink">{value}</p>
    </div>
  );
}

function TeamsPanel({ boardData }: { boardData: SharedBoardData }) {
  const teams = boardData.teams;
  const hasGroupData = teams.some((team) => team.group);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-4">
        {["winner", "runner-up", "group", "quarter-final"].map((status) => (
          <CampaignMetric
            key={status}
            label={formatStatus(status)}
            value={`${teams.filter((team) => team.status === status).length}`}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl bg-campaign-panel-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={sharedBoardTableHeadClassName}>
                Team
              </TableHead>
              <TableHead className={sharedBoardTableHeadClassName}>
                Allocated to
              </TableHead>
              {hasGroupData ? (
                <TableHead className={sharedBoardTableHeadClassName}>
                  Group
                </TableHead>
              ) : null}
              <TableHead className={sharedBoardTableHeadClassName}>
                Status
              </TableHead>
              <TableHead
                className={`${sharedBoardTableHeadClassName} text-right`}
              >
                Pts
              </TableHead>
              <TableHead
                className={`${sharedBoardTableHeadClassName} hidden text-right sm:table-cell`}
              >
                Goals for
              </TableHead>
              <TableHead
                className={`${sharedBoardTableHeadClassName} hidden text-right sm:table-cell`}
              >
                Goals against
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{team.allocatedToName ?? "Unallocated"}</TableCell>
                {hasGroupData ? (
                  <TableCell>{team.group ?? "TBC"}</TableCell>
                ) : null}
                <TableCell>
                  <StatusBadge status={team.status} />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {team.points}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {team.goalsFor}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {team.goalsAgainst}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs font-semibold text-campaign-muted">
        Showing all {teams.length} cached tournament teams.
      </p>
    </div>
  );
}

function BadgesPanel({
  badges,
  hasFinalMatches,
  standings,
}: {
  badges: SharedBoardBadge[];
  hasFinalMatches: boolean;
  standings: SharedBoardStanding[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {badges.map((badge) => {
        const holders = hasFinalMatches
          ? badge.holderParticipantIds
              .map(
                (participantId) =>
                  standings.find(
                    (standing) => standing.participantId === participantId,
                  )?.name,
              )
              .filter(Boolean)
          : [];

        return (
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
                variant={
                  badge.status === "manual-future" ? "outline" : "secondary"
                }
              >
                {badge.status}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {holders.length > 0 ? (
                holders.map((holder) => <Badge key={holder}>{holder}</Badge>)
              ) : !hasFinalMatches && badge.status !== "manual-future" ? (
                <Badge variant="outline">Awaiting results</Badge>
              ) : (
                <Badge variant="outline">No holder yet</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchesPanel({
  matches,
  stickyHeader = false,
}: {
  matches: SharedBoardMatch[];
  stickyHeader?: boolean;
}) {
  if (stickyHeader) {
    return (
      <div className="rounded-2xl bg-campaign-panel-soft">
        <div className="grid gap-3 p-3 md:hidden" data-testid="matches-mobile-list">
          {matches.map((match) => (
            <MobileMatchCard key={match.id} match={match} />
          ))}
        </div>
        <div className="hidden md:block">
          <MatchesHeader sticky />
          <div data-testid="matches-row-scroll">
            {matches.map((match) => (
              <MatchGridRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-campaign-panel-soft">
      <div className="grid gap-3 p-3 md:hidden" data-testid="matches-mobile-list">
        {matches.map((match) => (
          <MobileMatchCard key={match.id} match={match} />
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={sharedBoardTableHeadClassName}>
                Match
              </TableHead>
              <TableHead className={sharedBoardTableHeadClassName}>
                Participants
              </TableHead>
              <TableHead
                className={`${sharedBoardTableHeadClassName} hidden sm:table-cell`}
              >
                Stage
              </TableHead>
              <TableHead
                className={`${sharedBoardTableHeadClassName} hidden md:table-cell`}
              >
                Kickoff
              </TableHead>
              <TableHead className={sharedBoardTableHeadClassName}>
                Status
              </TableHead>
              <TableHead
                className={`${sharedBoardTableHeadClassName} text-right`}
              >
                Score
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.homeTeamName} v {match.awayTeamName}
                </TableCell>
                <TableCell>{match.participantLabel}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {match.stage}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {match.kickoffLabel}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      match.status === "delayed" ? "outline" : "secondary"
                    }
                  >
                    {formatMatchStatus(match.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MatchesHeader({ sticky = false }: { sticky?: boolean }) {
  return (
    <div
      className={`${matchesGridClassName} overflow-hidden rounded-t-2xl ${
        sticky ? stickyBoardHeaderClassName : ""
      }`}
      data-testid="matches-column-header"
      role="row"
    >
      <div className={sharedBoardGridHeadClassName} role="columnheader">
        Match
      </div>
      <div className={sharedBoardGridHeadClassName} role="columnheader">
        Participants
      </div>
      <div className={sharedBoardGridHeadClassName} role="columnheader">
        Stage
      </div>
      <div className={sharedBoardGridHeadClassName} role="columnheader">
        Kickoff
      </div>
      <div className={sharedBoardGridHeadClassName} role="columnheader">
        Status
      </div>
      <div
        className={`${sharedBoardGridHeadClassName} text-right`}
        role="columnheader"
      >
        Score
      </div>
    </div>
  );
}

function MatchGridRow({ match }: { match: SharedBoardMatch }) {
  return (
    <div
      className={`${matchesGridClassName} border-b border-campaign-ring transition-colors`}
      role="row"
    >
      <div className="flex min-w-0 items-center px-2 py-2 font-medium" role="cell">
        <span className="whitespace-normal break-words">
          {match.homeTeamName} v {match.awayTeamName}
        </span>
      </div>
      <div className="flex min-w-0 items-center px-2 py-2" role="cell">
        <span className="whitespace-normal break-words">
          {match.participantLabel}
        </span>
      </div>
      <div className="flex min-w-0 items-center px-2 py-2" role="cell">
        <span className="whitespace-normal break-words">{match.stage}</span>
      </div>
      <div className="flex min-w-0 items-center px-2 py-2" role="cell">
        <span className="whitespace-normal break-words">
          {match.kickoffLabel}
        </span>
      </div>
      <div className="flex min-w-0 items-center px-2 py-2" role="cell">
        <Badge variant={match.status === "delayed" ? "outline" : "secondary"}>
          {formatMatchStatus(match.status)}
        </Badge>
      </div>
      <div
        className="flex items-center justify-end px-2 py-2 text-right font-mono font-semibold"
        role="cell"
      >
        {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
      </div>
    </div>
  );
}

function MobileMatchCard({ match }: { match: SharedBoardMatch }) {
  return (
    <article className="rounded-2xl bg-campaign-page p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-black leading-tight text-campaign-ink">
            {match.homeTeamName} v {match.awayTeamName}
          </h3>
          <p className="mt-1 break-words text-xs font-semibold text-campaign-muted">
            {match.participantLabel}
          </p>
        </div>
        <div className="shrink-0 text-right font-mono text-lg font-black text-campaign-purple-strong">
          {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <MobileMatchDetail label="Stage" value={match.stage} />
        <MobileMatchDetail label="Kickoff" value={match.kickoffLabel} />
        <div className="rounded-xl bg-white px-3 py-2">
          <p className="text-xs font-black uppercase text-campaign-magenta">
            Status
          </p>
          <Badge
            className="mt-1"
            variant={match.status === "delayed" ? "outline" : "secondary"}
          >
            {formatMatchStatus(match.status)}
          </Badge>
        </div>
      </div>
    </article>
  );
}

function MobileMatchDetail({
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

function formatMatchSummary(match: SharedBoardMatch) {
  const score =
    match.homeScore === null || match.awayScore === null
      ? match.status
      : `${match.homeScore}:${match.awayScore}`;

  return `${match.homeTeamName} v ${match.awayTeamName} - ${score}`;
}

function StatsPanel({
  activeTeams,
  delayedMatches,
  finalMatches,
  scheduledMatches,
  totalGoals,
}: {
  activeTeams: number;
  delayedMatches: number;
  finalMatches: number;
  scheduledMatches: number;
  totalGoals: number;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={<Sparkles className="size-4" aria-hidden="true" />}
        label="Goals"
        value={`${totalGoals}`}
        body="Derived from cached match results."
      />
      <StatTile
        icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        label="Teams tracked"
        value={`${activeTeams}`}
        body="Teams currently visible in cached tournament data."
      />
      <StatTile
        icon={<CalendarDays className="size-4" aria-hidden="true" />}
        label="Completed"
        value={`${finalMatches}`}
        body="Matches with completed cached results."
      />
      <StatTile
        icon={<RefreshCw className="size-4" aria-hidden="true" />}
        label="Pending"
        value={`${scheduledMatches + delayedMatches}`}
        body="Scheduled or delayed fixtures still awaiting completed results."
      />
    </div>
  );
}

const scoringRows = [
  ["Group win", "3 pts"],
  ["Group draw", "1 pt"],
  ["Reach Round of 16", "+5 pts"],
  ["Reach quarter-final", "+8 pts"],
  ["Reach semi-final", "+12 pts"],
  ["Runner-up", "+15 pts"],
  ["Win the World Cup", "+25 pts"],
] as const;

function ExplainerPanel() {
  return (
    <CampaignPanel className="overflow-hidden p-0">
      <div className="bg-campaign-purple px-4 py-5 text-white sm:px-6">
        <p className="text-xs font-black uppercase tracking-normal">
          Explainer
        </p>
        <h3 className="mt-1 text-2xl font-black">How scoring works</h3>
        <p className="mt-1 text-sm font-semibold text-white/85">
          Your teams play. You get the points.
        </p>
      </div>

      <div className="divide-y divide-campaign-ring">
        {scoringRows.map(([label, points]) => (
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
            key={label}
          >
            <span className="text-sm font-semibold text-campaign-muted">
              {label}
            </span>
            <span className="shrink-0 font-black text-campaign-purple-strong">
              {points}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 bg-campaign-yellow/35 px-4 py-5 sm:px-6">
        <p className="text-sm font-semibold text-campaign-ink">
          If you have more than one team, their points are added together.
          Extra teams are handed out randomly. It&apos;s all part of the luck
          of the draw.
        </p>
        <p className="font-black text-campaign-purple-strong">
          No predictions. No football knowledge needed.
        </p>
      </div>
    </CampaignPanel>
  );
}

function StatTile({
  body,
  icon,
  label,
  value,
}: {
  body: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <CampaignPanel className="p-4" tone="pink">
      <div className="flex items-center gap-2 text-campaign-purple">
        {icon}
        <span className="text-xs font-black uppercase tracking-normal">
          {label}
        </span>
      </div>
      <p className="mt-3 text-xl font-black text-campaign-purple-strong">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-campaign-muted">{body}</p>
    </CampaignPanel>
  );
}
