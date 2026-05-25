export type TournamentStage =
  | "group"
  | "round-of-16"
  | "quarter-final"
  | "semi-final"
  | "runner-up"
  | "winner";

export type ScoringParticipant = {
  id: string;
  name: string;
};

export type ScoringAllocation = {
  participantId: string;
  teamId: string;
};

export type TeamPerformanceInput = {
  teamId: string;
  name: string;
  groupStageWins: number;
  groupStageDraws: number;
  reachedStage: TournamentStage;
  goalsFor: number;
  goalsAgainst: number;
  cards?: number | null;
  eliminatedOrder?: number | null;
};

export type TeamScore = {
  teamId: string;
  points: number;
  breakdown: {
    groupStageWins: number;
    groupStageDraws: number;
    groupStageWinPoints: number;
    groupStageDrawPoints: number;
    progressionPoints: number;
  };
};

export type ParticipantScore = {
  participantId: string;
  name: string;
  rank: number;
  points: number;
  teamCount: number;
  teamIds: string[];
};

export type BadgeCategoryInput = {
  id: string;
  key: BadgeCategoryKey | LegacyPlacementBadgeCategoryKey;
  label: string;
  status?: "active" | "undecided" | "manual-future";
};

export type LegacyPlacementBadgeCategoryKey =
  | "first"
  | "second"
  | "third"
  | "fourth";

export type BadgeCategoryKey =
  | "first-place"
  | "second-place"
  | "third-place"
  | "fourth-place"
  | "wooden-spoon"
  | "first-knocked-out"
  | "most-goals-conceded"
  | "fewest-goals-scored"
  | "most-cards";

export type BadgeHolder = {
  badgeCategoryId: string;
  participantId: string | null;
  teamId: string | null;
  reason: string;
};

const scoringRules = {
  groupStageWin: 3,
  groupStageDraw: 1,
  progression: {
    group: 0,
    "round-of-16": 5,
    "quarter-final": 8,
    "semi-final": 12,
    "runner-up": 15,
    winner: 25,
  },
} as const satisfies {
  groupStageWin: number;
  groupStageDraw: number;
  progression: Record<TournamentStage, number>;
};

export function calculateTeamScore(team: TeamPerformanceInput): TeamScore {
  const groupStageWinPoints = team.groupStageWins * scoringRules.groupStageWin;
  const groupStageDrawPoints = team.groupStageDraws * scoringRules.groupStageDraw;
  const progressionPoints = scoringRules.progression[team.reachedStage];

  return {
    teamId: team.teamId,
    points: groupStageWinPoints + groupStageDrawPoints + progressionPoints,
    breakdown: {
      groupStageWins: team.groupStageWins,
      groupStageDraws: team.groupStageDraws,
      groupStageWinPoints,
      groupStageDrawPoints,
      progressionPoints,
    },
  };
}

export function calculateTeamScores(teams: TeamPerformanceInput[]) {
  return teams.map(calculateTeamScore);
}

export function calculateParticipantScores(
  participants: ScoringParticipant[],
  allocations: ScoringAllocation[],
  teamScores: TeamScore[],
): ParticipantScore[] {
  const scoresByTeam = new Map(
    teamScores.map((score) => [score.teamId, score.points]),
  );

  const totals = participants.map((participant) => {
    const teamIds = allocations
      .filter((allocation) => allocation.participantId === participant.id)
      .map((allocation) => allocation.teamId);
    const points = teamIds.reduce(
      (total, teamId) => total + (scoresByTeam.get(teamId) ?? 0),
      0,
    );

    return {
      participantId: participant.id,
      name: participant.name,
      points,
      teamCount: teamIds.length,
      teamIds,
    };
  });

  const sorted = totals.sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );

  let lastPoints: number | null = null;
  let lastRank = 0;

  return sorted.map((score, index) => {
    if (score.points !== lastPoints) {
      lastRank = index + 1;
      lastPoints = score.points;
    }

    return {
      ...score,
      rank: lastRank,
    };
  });
}

export function calculateBadgeHolders(input: {
  categories: BadgeCategoryInput[];
  participantScores: ParticipantScore[];
  teams: TeamPerformanceInput[];
  allocations: ScoringAllocation[];
}): BadgeHolder[] {
  return input.categories.flatMap((category) => {
    if (category.status === "manual-future") {
      return [];
    }

    const categoryKey = normalizeBadgeCategoryKey(category.key);

    if (!categoryKey) {
      return [];
    }

    switch (categoryKey) {
      case "first-place":
        return participantRankBadge(category.id, input.participantScores, 1);
      case "second-place":
        return participantRankBadge(category.id, input.participantScores, 2);
      case "third-place":
        return participantRankBadge(category.id, input.participantScores, 3);
      case "fourth-place":
        return participantRankBadge(category.id, input.participantScores, 4);
      case "wooden-spoon":
        return woodenSpoonBadge(category.id, input.participantScores);
      case "first-knocked-out":
        return teamMetricBadge({
          badgeCategoryId: category.id,
          teams: input.teams.filter((team) => team.eliminatedOrder != null),
          allocations: input.allocations,
          metric: (team) => team.eliminatedOrder ?? Number.POSITIVE_INFINITY,
          mode: "min",
          reason: "Allocated the first eliminated team.",
        });
      case "most-goals-conceded":
        return teamMetricBadge({
          badgeCategoryId: category.id,
          teams: input.teams,
          allocations: input.allocations,
          metric: (team) => team.goalsAgainst,
          mode: "max",
          reason: "Allocated the team with the most goals conceded.",
        });
      case "fewest-goals-scored":
        return teamMetricBadge({
          badgeCategoryId: category.id,
          teams: input.teams,
          allocations: input.allocations,
          metric: (team) => team.goalsFor,
          mode: "min",
          reason: "Allocated the team with the fewest goals scored.",
        });
      case "most-cards":
        return teamMetricBadge({
          badgeCategoryId: category.id,
          teams: input.teams.filter((team) => team.cards != null),
          allocations: input.allocations,
          metric: (team) => team.cards ?? 0,
          mode: "max",
          reason: "Allocated the team with the most recorded cards.",
        });
      default:
        return [];
    }
  });
}

export function normalizeBadgeCategoryKey(
  key: string,
): BadgeCategoryKey | null {
  switch (key) {
    case "first":
      return "first-place";
    case "second":
      return "second-place";
    case "third":
      return "third-place";
    case "fourth":
      return "fourth-place";
    case "first-place":
    case "second-place":
    case "third-place":
    case "fourth-place":
    case "wooden-spoon":
    case "first-knocked-out":
    case "most-goals-conceded":
    case "fewest-goals-scored":
    case "most-cards":
      return key;
    default:
      return null;
  }
}

function participantRankBadge(
  badgeCategoryId: string,
  participantScores: ParticipantScore[],
  rank: number,
): BadgeHolder[] {
  return participantScores
    .filter((score) => score.rank === rank)
    .map((score) => ({
      badgeCategoryId,
      participantId: score.participantId,
      teamId: null,
      reason: `Shared rank ${rank} with ${score.points} points.`,
    }));
}

function woodenSpoonBadge(
  badgeCategoryId: string,
  participantScores: ParticipantScore[],
): BadgeHolder[] {
  const lowestPoints = Math.min(
    ...participantScores.map((score) => score.points),
  );

  return participantScores
    .filter((score) => score.points === lowestPoints)
    .map((score) => ({
      badgeCategoryId,
      participantId: score.participantId,
      teamId: null,
      reason: `Lowest total with ${score.points} points.`,
    }));
}

function teamMetricBadge({
  badgeCategoryId,
  teams,
  allocations,
  metric,
  mode,
  reason,
}: {
  badgeCategoryId: string;
  teams: TeamPerformanceInput[];
  allocations: ScoringAllocation[];
  metric: (team: TeamPerformanceInput) => number;
  mode: "min" | "max";
  reason: string;
}): BadgeHolder[] {
  if (teams.length === 0) {
    return [];
  }

  const targetValue =
    mode === "max"
      ? Math.max(...teams.map(metric))
      : Math.min(...teams.map(metric));
  const targetTeamIds = new Set(
    teams.filter((team) => metric(team) === targetValue).map((team) => team.teamId),
  );

  return allocations
    .filter((allocation) => targetTeamIds.has(allocation.teamId))
    .map((allocation) => ({
      badgeCategoryId,
      participantId: allocation.participantId,
      teamId: allocation.teamId,
      reason,
    }));
}
