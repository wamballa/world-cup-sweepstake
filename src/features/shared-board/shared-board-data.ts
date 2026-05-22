import type { Database } from "@/server/supabase/database.types";

export type SharedBoardParticipant = {
  id: string;
  name: string;
  emailUpdatesEnabled: boolean;
};

export type SharedBoardStanding = {
  participantId: string;
  name: string;
  rank: number;
  points: number;
  teamCount: number;
  teamNames: string[];
  teamIds: string[];
};

export type SharedBoardTeamStatus =
  | "group"
  | "round-of-16"
  | "quarter-final"
  | "semi-final"
  | "runner-up"
  | "winner"
  | "eliminated";

export type SharedBoardTeam = {
  id: string;
  name: string;
  shortName: string;
  group: string | null;
  status: SharedBoardTeamStatus;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  allocatedTo: string | null;
  allocatedToName: string | null;
};

export type SharedBoardMatch = {
  id: string;
  stage: string;
  status: Database["public"]["Enums"]["match_status"];
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeParticipantName: string | null;
  awayParticipantName: string | null;
  participantLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: string | null;
  kickoffLabel: string;
  freshness: string;
};

export type SharedBoardBadge = {
  id: string;
  label: string;
  status: "active" | "undecided" | "manual-future";
  holderParticipantIds: string[];
  supportLine: string;
};

export type SharedBoardSyncState = {
  lastSuccessfulSyncAt: string | null;
  freshnessLabel: string;
};

export type SharedBoardSummary = {
  leaderName: string | null;
  finalMatchCount: number;
  delayedMatchCount: number;
  scheduledMatchCount: number;
  totalGoals: number;
  activeTeamCount: number;
  hasFinalMatches: boolean;
};

export type SharedBoardData = {
  sweepstakeId: string;
  sweepstakeName: string;
  tournamentCode: string;
  participants: SharedBoardParticipant[];
  standings: SharedBoardStanding[];
  teams: SharedBoardTeam[];
  matches: SharedBoardMatch[];
  badges: SharedBoardBadge[];
  syncState: SharedBoardSyncState;
  summary: SharedBoardSummary;
};

export type SharedBoardMapperInput = {
  sweepstake: {
    id: string;
    name: string;
    tournament_code: string;
  };
  participants: Array<{
    id: string;
    display_name: string;
    sort_order: number;
  }>;
  participantEmailPreferences?: Array<{
    participant_id: string;
    update_opt_in: boolean;
  }>;
  allocations: Array<{
    participant_id: string;
    team_id: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    short_name: string | null;
    group_name: string | null;
  }>;
  teamScores: Array<{
    team_id: string;
    points: number;
  }>;
  participantScores: Array<{
    participant_id: string;
    points: number;
    rank: number | null;
    team_count: number;
  }>;
  badgeCategories: Array<{
    id: string;
    key: string;
    label: string;
    status: Database["public"]["Enums"]["badge_status"];
    sort_order: number;
    is_enabled: boolean;
  }>;
  badgeHolders: Array<{
    badge_category_id: string;
    participant_id: string | null;
    team_id: string | null;
    reason: string | null;
  }>;
  matches: Array<{
    id: string;
    stage: string;
    status: Database["public"]["Enums"]["match_status"];
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number | null;
    away_score: number | null;
    kickoff_at: string | null;
    data_freshness: string;
  }>;
  syncState: {
    last_successful_sync_at: string | null;
    updated_at: string | null;
  } | null;
};

const badgeSupportLines: Record<string, string> = {
  "first-place": "Highest participant total from cached tournament data.",
  "second-place": "Second-highest participant total from cached tournament data.",
  "third-place": "Third-highest participant total from cached tournament data.",
  "fourth-place": "Fourth-highest participant total from cached tournament data.",
  "wooden-spoon": "Lowest participant total from cached tournament data.",
  "first-knocked-out": "Allocated the first team eliminated from cached results.",
  "most-goals-conceded": "Allocated the team with the most goals conceded.",
  "fewest-goals-scored": "Allocated the team with the fewest goals scored.",
};

export function buildSharedBoardData(
  input: SharedBoardMapperInput,
): SharedBoardData {
  const emailOptIns = new Map(
    (input.participantEmailPreferences ?? []).map((preference) => [
      preference.participant_id,
      preference.update_opt_in,
    ]),
  );
  const participants = [...input.participants]
    .sort((a, b) => a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name))
    .map((participant) => ({
      id: participant.id,
      name: participant.display_name,
      emailUpdatesEnabled: emailOptIns.get(participant.id) ?? false,
    }));
  const teamsById = new Map(input.teams.map((team) => [team.id, team]));
  const teamPoints = new Map(
    input.teamScores.map((score) => [score.team_id, score.points]),
  );
  const participantScoreRows = new Map(
    input.participantScores.map((score) => [score.participant_id, score]),
  );
  const allocationsByParticipant = groupAllocationsByParticipant(
    input.allocations,
  );
  const allocationByTeam = new Map(
    input.allocations.map((allocation) => [
      allocation.team_id,
      allocation.participant_id,
    ]),
  );
  const participantNamesById = new Map(
    participants.map((participant) => [participant.id, participant.name]),
  );
  const teamStats = buildTeamStats(input.teams, input.matches);
  const standings = rankStandings(
    participants.map((participant) => {
      const teamIds = allocationsByParticipant.get(participant.id) ?? [];
      const persistedScore = participantScoreRows.get(participant.id);
      const points =
        persistedScore?.points ??
        teamIds.reduce((total, teamId) => total + (teamPoints.get(teamId) ?? 0), 0);

      return {
        participantId: participant.id,
        name: participant.name,
        points,
        teamCount: persistedScore?.team_count ?? teamIds.length,
        teamIds,
        teamNames: teamIds.map((teamId) => teamsById.get(teamId)?.name ?? "Unknown team"),
      };
    }),
  );

  const sharedTeams = input.teams.map((team) => {
    const stats = teamStats.get(team.id);
    const allocatedTo = allocationByTeam.get(team.id) ?? null;

    return {
      id: team.id,
      name: team.name,
      shortName: team.short_name ?? createShortTeamName(team.name),
      group: team.group_name,
      status: stats?.status ?? "group",
      points: teamPoints.get(team.id) ?? 0,
      goalsFor: stats?.goalsFor ?? 0,
      goalsAgainst: stats?.goalsAgainst ?? 0,
      allocatedTo,
      allocatedToName:
        participants.find((participant) => participant.id === allocatedTo)?.name ??
        null,
    };
  });
  const sharedMatches = input.matches
    .map((match) => ({
      id: match.id,
      stage: formatStage(match.stage),
      status: match.status,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      homeTeamName:
        (match.home_team_id && teamsById.get(match.home_team_id)?.name) ??
        "TBC",
      awayTeamName:
        (match.away_team_id && teamsById.get(match.away_team_id)?.name) ??
        "TBC",
      homeParticipantName: getParticipantNameForTeam(
        match.home_team_id,
        allocationByTeam,
        participantNamesById,
      ),
      awayParticipantName: getParticipantNameForTeam(
        match.away_team_id,
        allocationByTeam,
        participantNamesById,
      ),
      participantLabel: formatMatchParticipants(
        getParticipantNameForTeam(
          match.home_team_id,
          allocationByTeam,
          participantNamesById,
        ),
        getParticipantNameForTeam(
          match.away_team_id,
          allocationByTeam,
          participantNamesById,
        ),
      ),
      homeScore: match.home_score,
      awayScore: match.away_score,
      kickoffAt: match.kickoff_at,
      kickoffLabel: formatKickoff(match.kickoff_at),
      freshness: match.data_freshness,
    }))
    .sort(sortMatches);

  return {
    sweepstakeId: input.sweepstake.id,
    sweepstakeName: input.sweepstake.name,
    tournamentCode: input.sweepstake.tournament_code,
    participants,
    standings,
    teams: sharedTeams,
    matches: sharedMatches,
    badges: input.badgeCategories
      .filter((category) => category.is_enabled)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
      .map((category) => ({
        id: category.id,
        label: category.label,
        status: category.status.replace("_", "-") as SharedBoardBadge["status"],
        holderParticipantIds: input.badgeHolders
          .filter((holder) => holder.badge_category_id === category.id)
          .map((holder) => holder.participant_id)
          .filter((participantId): participantId is string => Boolean(participantId)),
        supportLine:
          badgeSupportLines[category.key] ??
          "Calculated from cached sweepstake data.",
      })),
    syncState: {
      lastSuccessfulSyncAt: input.syncState?.last_successful_sync_at ?? null,
      freshnessLabel: formatSyncFreshness(input.syncState?.last_successful_sync_at ?? null),
    },
    summary: {
      leaderName: standings[0]?.name ?? null,
      finalMatchCount: sharedMatches.filter((match) => match.status === "final").length,
      delayedMatchCount: sharedMatches.filter((match) => match.status === "delayed").length,
      scheduledMatchCount: sharedMatches.filter((match) => match.status === "scheduled").length,
      totalGoals: sharedTeams.reduce((total, team) => total + team.goalsFor, 0),
      activeTeamCount: sharedTeams.filter((team) => team.status !== "eliminated").length,
      hasFinalMatches: sharedMatches.some((match) => match.status === "final"),
    },
  };
}

function getParticipantNameForTeam(
  teamId: string | null,
  allocationByTeam: Map<string, string>,
  participantNamesById: Map<string, string>,
) {
  if (!teamId) {
    return null;
  }

  const participantId = allocationByTeam.get(teamId);

  if (!participantId) {
    return null;
  }

  return participantNamesById.get(participantId) ?? null;
}

function formatMatchParticipants(
  homeParticipantName: string | null,
  awayParticipantName: string | null,
) {
  if (homeParticipantName && awayParticipantName) {
    return homeParticipantName === awayParticipantName
      ? homeParticipantName
      : `${homeParticipantName} & ${awayParticipantName}`;
  }

  return homeParticipantName ?? awayParticipantName ?? "TBC";
}

function groupAllocationsByParticipant(
  allocations: SharedBoardMapperInput["allocations"],
) {
  const grouped = new Map<string, string[]>();

  for (const allocation of allocations) {
    const existing = grouped.get(allocation.participant_id) ?? [];
    existing.push(allocation.team_id);
    grouped.set(allocation.participant_id, existing);
  }

  return grouped;
}

function rankStandings(
  standings: Array<Omit<SharedBoardStanding, "rank">>,
): SharedBoardStanding[] {
  const sorted = [...standings].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );
  let lastPoints: number | null = null;
  let lastRank = 0;

  return sorted.map((standing, index) => {
    if (standing.points !== lastPoints) {
      lastRank = index + 1;
      lastPoints = standing.points;
    }

    return {
      ...standing,
      rank: lastRank,
    };
  });
}

function buildTeamStats(
  teams: SharedBoardMapperInput["teams"],
  matches: SharedBoardMapperInput["matches"],
) {
  return new Map(
    teams.map((team) => {
      const teamMatches = matches.filter(
        (match) =>
          match.home_team_id === team.id || match.away_team_id === team.id,
      );
      const finalMatches = teamMatches.filter((match) => match.status === "final");

      return [
        team.id,
        {
          goalsFor: finalMatches.reduce(
            (total, match) => total + goalsFor(team.id, match),
            0,
          ),
          goalsAgainst: finalMatches.reduce(
            (total, match) => total + goalsAgainst(team.id, match),
            0,
          ),
          status: deriveTeamStatus(team.id, finalMatches),
        },
      ] as const;
    }),
  );
}

function deriveTeamStatus(
  teamId: string,
  matches: SharedBoardMapperInput["matches"],
): SharedBoardTeamStatus {
  const final = matches.find((match) => normalizeStage(match.stage) === "final");

  if (final) {
    return teamWonMatch(teamId, final) ? "winner" : "runner-up";
  }

  const stages = matches.map((match) => normalizeStage(match.stage));

  if (stages.includes("semi-final")) {
    return "semi-final";
  }

  if (stages.includes("quarter-final")) {
    return "quarter-final";
  }

  if (stages.includes("round-of-16")) {
    return "round-of-16";
  }

  return "group";
}

function normalizeStage(stage: string): SharedBoardTeamStatus | "final" {
  switch (stage) {
    case "LAST_16":
    case "ROUND_OF_16":
      return "round-of-16";
    case "QUARTER_FINALS":
    case "QUARTER_FINAL":
      return "quarter-final";
    case "SEMI_FINALS":
    case "SEMI_FINAL":
      return "semi-final";
    case "FINAL":
      return "final";
    default:
      return "group";
  }
}

function teamWonMatch(
  teamId: string,
  match: SharedBoardMapperInput["matches"][number],
) {
  if (match.home_score == null || match.away_score == null) {
    return false;
  }

  if (match.home_team_id === teamId) {
    return match.home_score > match.away_score;
  }

  if (match.away_team_id === teamId) {
    return match.away_score > match.home_score;
  }

  return false;
}

function goalsFor(
  teamId: string,
  match: SharedBoardMapperInput["matches"][number],
) {
  if (match.home_team_id === teamId) {
    return match.home_score ?? 0;
  }

  if (match.away_team_id === teamId) {
    return match.away_score ?? 0;
  }

  return 0;
}

function goalsAgainst(
  teamId: string,
  match: SharedBoardMapperInput["matches"][number],
) {
  if (match.home_team_id === teamId) {
    return match.away_score ?? 0;
  }

  if (match.away_team_id === teamId) {
    return match.home_score ?? 0;
  }

  return 0;
}

function formatStage(stage: string) {
  return stage
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatKickoff(kickoffAt: string | null) {
  if (!kickoffAt) {
    return "Kickoff TBC";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(kickoffAt));
}

function formatSyncFreshness(lastSuccessfulSyncAt: string | null) {
  if (!lastSuccessfulSyncAt) {
    return "Awaiting first sync";
  }

  return `Updated ${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(lastSuccessfulSyncAt))}`;
}

function sortMatches(a: SharedBoardMatch, b: SharedBoardMatch) {
  if (a.kickoffAt && b.kickoffAt) {
    return (
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime() ||
      a.stage.localeCompare(b.stage) ||
      a.homeTeamName.localeCompare(b.homeTeamName)
    );
  }

  if (!a.kickoffAt && b.kickoffAt) {
    return 1;
  }

  if (a.kickoffAt && !b.kickoffAt) {
    return -1;
  }

  return a.stage.localeCompare(b.stage) || a.homeTeamName.localeCompare(b.homeTeamName);
}

function createShortTeamName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
