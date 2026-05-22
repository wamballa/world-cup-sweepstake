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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  type SharedBoardBadge,
  type SharedBoardData,
  type SharedBoardMatch,
  type SharedBoardStanding,
} from "@/features/shared-board/shared-board-data";

import {
  formatStatus,
  InfoTile,
  Metric,
  StatusBadge,
} from "./demo-primitives";

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

  return (
    <section aria-labelledby="scoreboard-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Shared scoreboard
          </Badge>
          <h2 id="scoreboard-heading" className="mt-3 text-2xl font-semibold">
            {boardData.sweepstakeName || "Untitled sweepstake"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cached tournament data. {boardData.syncState.freshnessLabel}.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-[24rem]">
          <Metric
            label="Leader"
            value={leadingParticipant?.name ?? boardData.summary.leaderName ?? "-"}
          />
          <Metric label="Finals" value={`${boardData.summary.finalMatchCount}`} />
          <Metric label="Delayed" value={`${boardData.summary.delayedMatchCount}`} />
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-3 sm:p-4">
          <Tabs defaultValue="participants" className="gap-4">
            <TabsList className="grid h-auto w-full grid-cols-5">
              <TabsTrigger
                value="participants"
                className="h-9 px-1"
                aria-label="Participants"
              >
                <UsersRound className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Participants</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="h-9 px-1" aria-label="Teams">
                <ShieldCheck className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Teams</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="h-9 px-1" aria-label="Badges">
                <Medal className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="matches" className="h-9 px-1" aria-label="Matches">
                <CalendarDays className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Matches</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="h-9 px-1" aria-label="Stats">
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
        </CardContent>
      </Card>
    </section>
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
            className="rounded-lg border bg-surface-muted p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
                  #{standing.rank}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{standing.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {standing.teamNames.map((teamName) => (
                      <Badge
                        key={`${standing.participantId}-${teamName}`}
                        variant="outline"
                        className="max-w-full truncate"
                      >
                        {teamName}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">{standing.points}</p>
                <p className="text-xs text-muted-foreground">
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
            className="rounded-lg border border-dashed bg-surface-muted p-4"
            aria-label="Your sweepstake"
          >
            <div className="flex items-center gap-2 text-primary">
              <UserRound className="size-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-normal">
                Your sweepstake
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold">Choose your name</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick yourself above to see your teams, points, badges, and matches.
            </p>
          </div>
        )}
        <InfoTile
          icon={<Bell className="size-4" />}
          label="Updates"
          value="Email optional"
          body="No email provider is connected during this phase."
        />
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
  const upcomingMatch = relevantMatches.find((match) => match.status !== "final");
  const earnedBadges = hasFinalMatches
    ? boardData.badges
        .filter((badge) => badge.holderParticipantIds.includes(standing.participantId))
        .map((badge) => badge.label)
    : [];

  return (
    <div className="rounded-lg border bg-surface-muted p-4" aria-label="Your sweepstake">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <UserRound className="size-4" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-normal">
              Your sweepstake
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold">{standing.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rank #{standing.rank} with {standing.points} total points.
          </p>
        </div>
        <Badge variant={participant?.emailUpdatesEnabled ? "secondary" : "outline"}>
          {participant?.emailUpdatesEnabled ? "Email updates on" : "No email updates"}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Allocated teams
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allocatedTeams.map((team) => (
              <Badge key={team.id} variant="secondary">
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
            value={recentMatch ? formatMatchSummary(recentMatch) : "No recent result"}
          />
          <ParticipantSignal
            label="Next match"
            value={upcomingMatch ? formatMatchSummary(upcomingMatch) : "No upcoming match"}
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
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
          <Metric
            key={status}
            label={formatStatus(status)}
            value={`${teams.filter((team) => team.status === status).length}`}
          />
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Allocated to</TableHead>
            {hasGroupData ? <TableHead>Group</TableHead> : null}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pts</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Goals for</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Goals against</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell>
                {team.allocatedToName ?? "Unallocated"}
              </TableCell>
              {hasGroupData ? <TableCell>{team.group ?? "TBC"}</TableCell> : null}
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
      <p className="text-xs text-muted-foreground">
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
                  standings.find((standing) => standing.participantId === participantId)
                    ?.name,
              )
              .filter(Boolean)
          : [];

        return (
          <div key={badge.id} className="rounded-lg border bg-surface-muted p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{badge.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Match</TableHead>
          <TableHead>Participants</TableHead>
          <TableHead className="hidden sm:table-cell">Stage</TableHead>
          <TableHead className="hidden md:table-cell">Kickoff</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => (
          <TableRow key={match.id}>
            <TableCell className="font-medium">
              {match.homeTeamName} v {match.awayTeamName}
            </TableCell>
            <TableCell>{match.participantLabel}</TableCell>
            <TableCell className="hidden sm:table-cell">{match.stage}</TableCell>
            <TableCell className="hidden md:table-cell">
              {match.kickoffLabel}
            </TableCell>
            <TableCell>
              <Badge variant={match.status === "delayed" ? "outline" : "secondary"}>
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
      <InfoTile
        icon={<Sparkles className="size-4" />}
        label="Goals"
        value={`${totalGoals}`}
        body="Derived from cached match results."
      />
      <InfoTile
        icon={<ShieldCheck className="size-4" />}
        label="Teams tracked"
        value={`${activeTeams}`}
        body="Teams currently visible in cached tournament data."
      />
      <InfoTile
        icon={<CalendarDays className="size-4" />}
        label="Finished"
        value={`${finalMatches}`}
        body="Matches with final cached scores."
      />
      <InfoTile
        icon={<RefreshCw className="size-4" />}
        label="Pending"
        value={`${scheduledMatches + delayedMatches}`}
        body="Scheduled or delayed fixtures still awaiting final cached scores."
      />
    </div>
  );
}
