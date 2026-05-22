import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleGauge,
  Medal,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  CampaignCompactRow,
  CampaignHeader,
  CampaignHeading,
  CampaignIconDisc,
  CampaignLogoMark,
  CampaignMetric,
  CampaignPageStack,
  CampaignPanel,
  CampaignPill,
  CampaignSectionHeading,
  CampaignShell,
  CampaignTopStrip,
} from "@/components/campaign";
import { Badge } from "@/components/ui/badge";
import type {
  SharedBoardBadge,
  SharedBoardData,
  SharedBoardMatch,
  SharedBoardStanding,
  SharedBoardTeam,
} from "@/features/shared-board/shared-board-data";

export function Bl091SharedBoardPrototype({
  boardData,
}: {
  boardData: SharedBoardData;
}) {
  const leader = boardData.standings[0];
  const featuredParticipant = boardData.standings[1] ?? leader;
  const featuredTeams = boardData.teams.filter(
    (team) => team.allocatedTo === featuredParticipant?.participantId,
  );
  const nextMatches = boardData.matches.slice(0, 4);
  const topTeams = [...boardData.teams]
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, 6);

  return (
    <CampaignShell>
      <CampaignTopStrip>
        Fresh preview spike for BL-091. Original sweepstake direction, preview data only.
      </CampaignTopStrip>

      <CampaignPageStack>
        <CampaignHeader
          logo={
            <CampaignLogoMark
              alt="World Cup sweepstake logo"
              src="/brand/logo1-web.png"
            />
          }
          actions={
            <>
              <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-full border-2 border-campaign-ring bg-campaign-panel-soft px-4">
                <Search
                  className="size-5 shrink-0 text-campaign-purple"
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-semibold text-campaign-muted">
                  Find your name, teams, badges, and matches
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <HeaderIcon icon={<UsersRound className="size-5" />} label="Players" />
                <HeaderIcon icon={<ShieldCheck className="size-5" />} label="Teams" />
                <HeaderIcon icon={<Bell className="size-5" />} label="Updates" />
              </div>
            </>
          }
        >
          <CampaignHeading eyebrow="Sweepstake live board">
            {boardData.sweepstakeName}
          </CampaignHeading>
        </CampaignHeader>

        <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <CampaignHero
            activeTeams={boardData.summary.activeTeamCount}
            delayedMatches={boardData.summary.delayedMatchCount}
            finalMatches={boardData.summary.finalMatchCount}
            leader={leader}
            syncLabel={boardData.syncState.freshnessLabel}
          />
          <YourTeamsPanel
            participant={featuredParticipant}
            teams={featuredTeams}
            hasFinalMatches={boardData.summary.hasFinalMatches}
            badges={boardData.badges}
          />
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <LeaderboardPanel standings={boardData.standings} />
          <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <PromoStat
              icon={<Sparkles className="size-5" />}
              label="Tournament buzz"
              value={`${boardData.summary.totalGoals} goals`}
              body="Totals come from cached preview match data."
              tone="cyan"
            />
            <PromoStat
              icon={<CircleGauge className="size-5" />}
              label="Data state"
              value={boardData.syncState.freshnessLabel}
              body="Live pages keep the same freshness rules."
              tone="yellow"
            />
          </aside>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <TeamsPanel teams={topTeams} totalTeams={boardData.teams.length} />
          <MatchesPanel matches={nextMatches} />
        </section>

        <BadgesPanel
          badges={boardData.badges}
          hasFinalMatches={boardData.summary.hasFinalMatches}
          standings={boardData.standings}
        />
      </CampaignPageStack>
    </CampaignShell>
  );
}

function HeaderIcon({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-campaign-purple-strong">
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

function CampaignHero({
  activeTeams,
  delayedMatches,
  finalMatches,
  leader,
  syncLabel,
}: {
  activeTeams: number;
  delayedMatches: number;
  finalMatches: number;
  leader?: SharedBoardStanding;
  syncLabel: string;
}) {
  return (
    <CampaignPanel
      className="relative overflow-hidden p-5 sm:p-8"
      tone="magenta"
    >
      <div className="absolute -right-10 -top-12 size-40 rounded-full bg-campaign-yellow" />
      <div className="absolute bottom-8 right-10 size-20 rounded-full bg-campaign-cyan/80" />
      <div className="absolute -bottom-16 left-16 size-40 rounded-full bg-campaign-lavender/70" />
      <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end">
        <div>
          <Badge className="bg-white text-campaign-purple hover:bg-white">
            {syncLabel}
          </Badge>
          <h2 className="mt-5 max-w-2xl text-4xl font-black leading-none sm:text-6xl">
            Matchday bragging rights. Turned all the way up.
          </h2>
          <p className="mt-4 max-w-xl text-base font-semibold text-white/90 sm:text-lg">
            Leaderboards, team luck, badges, fixtures, and friendly office drama in one punchy shared board.
          </p>
        </div>
        <div className="grid gap-2">
          <CampaignMetric label="Current leader" value={leader?.name ?? "TBC"} />
          <CampaignMetric label="Finished matches" value={`${finalMatches}`} />
          <CampaignMetric label="Teams still tracked" value={`${activeTeams}`} />
          <CampaignMetric label="Delayed results" value={`${delayedMatches}`} />
        </div>
      </div>
    </CampaignPanel>
  );
}

function YourTeamsPanel({
  badges,
  hasFinalMatches,
  participant,
  teams,
}: {
  badges: SharedBoardBadge[];
  hasFinalMatches: boolean;
  participant?: SharedBoardStanding;
  teams: SharedBoardTeam[];
}) {
  const earnedBadges = hasFinalMatches
    ? badges.filter((badge) =>
        participant
          ? badge.holderParticipantIds.includes(participant.participantId)
          : false,
      )
    : [];

  return (
    <CampaignPanel className="p-5 sm:p-6" tone="cyan">
      <div className="flex items-start justify-between gap-4">
        <CampaignSectionHeading eyebrow="Your teams">
          {participant?.name ?? "Choose your name"}
        </CampaignSectionHeading>
        <CampaignIconDisc className="size-16 bg-white text-campaign-purple">
          <Trophy className="size-8" aria-hidden="true" />
        </CampaignIconDisc>
      </div>
      <p className="mt-1 text-sm font-semibold text-campaign-muted">
        Rank #{participant?.rank ?? "-"} with {participant?.points ?? 0} points.
      </p>

      <div className="mt-5 grid gap-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-campaign-purple-strong">
                {team.name}
              </p>
              <p className="text-xs font-semibold text-campaign-muted">
                {formatStatus(team.status)}
              </p>
            </div>
            <CampaignPill className="shrink-0" tone="yellow">
              {team.points} pts
            </CampaignPill>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-campaign-purple px-4 py-3 text-white">
        <p className="text-xs font-black uppercase text-campaign-yellow">
          Badge watch
        </p>
        <p className="mt-1 text-sm font-semibold">
          {earnedBadges.length > 0
            ? earnedBadges.map((badge) => badge.label).join(", ")
            : "Badges unlock when cached results decide them."}
        </p>
      </div>
    </CampaignPanel>
  );
}

function LeaderboardPanel({
  standings,
}: {
  standings: SharedBoardStanding[];
}) {
  return (
    <CampaignPanel>
      <div className="mb-4 flex items-center justify-between gap-3">
        <CampaignSectionHeading eyebrow="Leaderboard">
          Who is bossing the draw?
        </CampaignSectionHeading>
        <CampaignPill className="shrink-0 text-white" tone="purple">
          Top {standings.length}
        </CampaignPill>
      </div>

      <div className="grid gap-2">
        {standings.map((standing, index) => (
          <div
            key={standing.participantId}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-3 ${
              index === 0 ? "bg-campaign-blush" : "bg-campaign-page"
            }`}
          >
            <div
              className={`flex size-11 items-center justify-center rounded-full text-sm font-black ${
                index === 0
                  ? "bg-campaign-magenta text-white"
                  : "bg-campaign-purple text-white"
              }`}
            >
              #{standing.rank}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-campaign-ink">
                {standing.name}
              </p>
              <div className="mt-1 flex gap-1 overflow-hidden">
                {standing.teamNames.slice(0, 3).map((teamName) => (
                  <span
                    key={`${standing.participantId}-${teamName}`}
                    className="truncate rounded-full bg-white px-2 py-1 text-xs font-semibold text-campaign-muted"
                  >
                    {teamName}
                  </span>
                ))}
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
        ))}
      </div>
    </CampaignPanel>
  );
}

function PromoStat({
  body,
  icon,
  label,
  tone,
  value,
}: {
  body: string;
  icon: ReactNode;
  label: string;
  tone: "cyan" | "yellow";
  value: string;
}) {
  return (
    <CampaignPanel tone={tone}>
      <div className="flex items-center gap-2 text-campaign-purple">
        {icon}
        <p className="text-xs font-black uppercase">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black leading-tight text-campaign-purple-strong">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-campaign-muted">{body}</p>
    </CampaignPanel>
  );
}

function TeamsPanel({
  teams,
  totalTeams,
}: {
  teams: SharedBoardTeam[];
  totalTeams: number;
}) {
  return (
    <CampaignPanel tone="pink">
      <CampaignSectionHeading
        eyebrow="Teams"
        icon={<ShieldCheck className="size-5" />}
      >
        Points, owners, momentum
      </CampaignSectionHeading>
      <div className="mt-4 grid gap-2">
        {teams.map((team) => (
          <CampaignCompactRow
            key={team.id}
            title={team.name}
            detail={`${team.allocatedToName ?? "Unallocated"} - ${formatStatus(team.status)}`}
            value={`${team.points} pts`}
            marker={<ChevronRight className="size-4" aria-hidden="true" />}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-campaign-muted">
        Showing top preview teams from {totalTeams} cached tournament teams.
      </p>
    </CampaignPanel>
  );
}

function MatchesPanel({ matches }: { matches: SharedBoardMatch[] }) {
  return (
    <CampaignPanel>
      <CampaignSectionHeading
        eyebrow="Fixtures"
        icon={<CalendarDays className="size-5" />}
      >
        Matches that matter
      </CampaignSectionHeading>
      <div className="mt-4 grid gap-2">
        {matches.map((match) => (
          <CampaignCompactRow
            key={match.id}
            title={`${match.homeTeamName} v ${match.awayTeamName}`}
            detail={`${match.participantLabel} - ${match.kickoffLabel}`}
            value={
              match.homeScore == null || match.awayScore == null
                ? formatStatus(match.status)
                : `${match.homeScore}:${match.awayScore}`
            }
            marker={<ChevronRight className="size-4" aria-hidden="true" />}
          />
        ))}
      </div>
    </CampaignPanel>
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
    <CampaignPanel tone="purple">
      <CampaignSectionHeading
        eyebrow="Badges"
        icon={<Medal className="size-5" />}
        inverted
      >
        Glory, groans, and group chat fuel
      </CampaignSectionHeading>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
            <div key={badge.id} className="rounded-2xl bg-white p-4 text-campaign-ink">
              <p className="font-black text-campaign-purple-strong">{badge.label}</p>
              <p className="mt-2 text-sm font-semibold text-campaign-muted">
                {holders.length > 0
                  ? holders.join(", ")
                  : "Awaiting cached results"}
              </p>
            </div>
          );
        })}
      </div>
    </CampaignPanel>
  );
}

function formatStatus(status: string) {
  return status
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
