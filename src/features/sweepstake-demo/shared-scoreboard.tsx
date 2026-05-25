import {
  Bell,
  CalendarDays,
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

import { formatStatus, StatusBadge } from "./demo-primitives";

const sharedBoardTabTriggerClassName =
  "h-8 rounded-xl px-1 py-0 font-black leading-none !text-campaign-purple/65 hover:!text-campaign-purple data-active:!bg-transparent data-active:!text-campaign-purple-strong data-active:!shadow-none data-[state=active]:!bg-transparent data-[state=active]:!text-campaign-purple-strong data-[state=active]:!shadow-none [&_span]:text-inherit [&_span]:leading-none [&_svg]:text-current";

const sharedBoardTableHeadClassName =
  "bg-campaign-muted font-black text-white hover:bg-campaign-muted hover:text-white";

export function SharedScoreboard({
  selectedParticipantId,
  boardData,
  leadingParticipant,
}: {
  selectedParticipantId?: string | null;
  boardData: SharedBoardData;
  leadingParticipant?: SharedBoardStanding;
}) {
  const standings = boardData.standings;
  const hasStarted = boardData.summary.hasFinalMatches;

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
          </div>
          <HeroSummaryMetrics
            boardData={boardData}
            leadingParticipant={leadingParticipant}
          />
        </div>
      </CampaignPanel>

      <CampaignPanel className="p-3 sm:p-4">
        <Tabs defaultValue="participants" className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-5 rounded-2xl bg-campaign-lavender/40 p-1">
            <TabsTrigger
              value="participants"
              className={sharedBoardTabTriggerClassName}
              aria-label="Participants"
            >
              <UsersRound className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Participants</span>
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className={sharedBoardTabTriggerClassName}
              aria-label="Teams"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className={sharedBoardTabTriggerClassName}
              aria-label="Badges"
            >
              <Medal className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className={sharedBoardTabTriggerClassName}
              aria-label="Matches"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Matches</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className={sharedBoardTabTriggerClassName}
              aria-label="Stats"
            >
              <Gauge className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <ParticipantsPanel
              selectedParticipantId={selectedParticipantId}
              boardData={boardData}
            />
          </TabsContent>
          <TabsContent value="teams">
            <TeamsPanel boardData={boardData} />
          </TabsContent>
          <TabsContent value="badges">
            <BadgesPanel
              badges={boardData.badges}
              hasFinalMatches={boardData.summary.hasFinalMatches}
              standings={standings}
            />
          </TabsContent>
          <TabsContent value="matches">
            <MatchesPanel matches={boardData.matches} />
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
        </Tabs>
      </CampaignPanel>
    </section>
  );
}

function HeroSummaryMetrics({
  boardData,
  leadingParticipant,
}: {
  boardData: SharedBoardData;
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
        value={leadingParticipant?.name ?? boardData.summary.leaderName ?? "-"}
      />
      <HeroSummaryMetric
        label="Finished"
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
}: {
  selectedParticipantId?: string | null;
  boardData: SharedBoardData;
}) {
  const standings = boardData.standings;
  const featuredParticipant = standings.find(
    (standing) => standing.participantId === selectedParticipantId,
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-3">
        {standings.map((standing, index) => (
          <motion.div
            key={standing.participantId}
            className={`rounded-2xl p-3 ${
              index === 0 ? "bg-campaign-blush" : "bg-campaign-page"
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${
                    index === 0 ? "bg-campaign-magenta" : "bg-campaign-purple"
                  }`}
                >
                  #{standing.rank}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black text-campaign-ink">
                    {standing.name}
                  </p>
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
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-campaign-purple-strong">
                  {standing.points}
                </p>
                <p className="text-xs font-semibold text-campaign-muted">
                  {standing.teamCount} teams
                </p>
              </div>
            </div>
          </motion.div>
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

function MatchesPanel({ matches }: { matches: SharedBoardMatch[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-campaign-panel-soft">
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
                  variant={match.status === "delayed" ? "outline" : "secondary"}
                >
                  {formatStatus(match.status)}
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
        label="Finished"
        value={`${finalMatches}`}
        body="Matches with final cached scores."
      />
      <StatTile
        icon={<RefreshCw className="size-4" aria-hidden="true" />}
        label="Pending"
        value={`${scheduledMatches + delayedMatches}`}
        body="Scheduled or delayed fixtures still awaiting final cached scores."
      />
    </div>
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
