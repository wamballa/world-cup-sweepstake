import {
  calculateBadgeHolders,
  calculateParticipantScores,
  calculateTeamScores,
  type BadgeCategoryInput,
  type TournamentStage,
} from "@/features/scoring/sweepstake-scoring";

export type TeamStatus =
  | "group"
  | "qualified"
  | "eliminated"
  | "quarter-final"
  | "semi-final"
  | "runner-up"
  | "winner";

export type MatchStatus = "scheduled" | "delayed" | "final";

export type BadgeStatus = "active" | "undecided" | "manual-future";

export type MockTeam = {
  id: string;
  name: string;
  shortName: string;
  group: string;
  seed: number;
  status: TeamStatus;
  points: number;
  groupStageWins: number;
  groupStageDraws: number;
  reachedStage: TournamentStage;
  goalsFor: number;
  goalsAgainst: number;
  cards: number | null;
  eliminatedOrder: number | null;
  allocatedTo: string;
};

export type MockParticipant = {
  id: string;
  name: string;
  displayName: string;
  emailCaptured: boolean;
};

export type MockMatch = {
  id: string;
  stage: "Group" | "Round of 16" | "Quarter-final" | "Semi-final" | "Final";
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoffLabel: string;
  freshness: "delayed" | "final" | "scheduled";
};

export type MockBadge = {
  id: string;
  label: string;
  status: BadgeStatus;
  holderParticipantIds: string[];
  supportLine: string;
};

export type ParticipantStanding = {
  participantId: string;
  name: string;
  rank: number;
  points: number;
  teamCount: number;
  teamNames: string[];
};

const participants = [
  "Maya",
  "Theo",
  "Priya",
  "Alex",
  "Nina",
  "Sam",
  "Ibrahim",
  "Grace",
] as const;

const mockNationNames = [
  "Aurora Republic",
  "Bayside Union",
  "Cedar Isles",
  "Driftmark",
  "Eastford",
  "Fjordland",
  "Golden Coast",
  "Harbor State",
  "Ironvale",
  "Juniper Nation",
  "Kingston Vale",
  "Lakeside",
  "Marina",
  "Northbridge",
  "Oak Republic",
  "Port Azure",
  "Quartz Coast",
  "Rivergate",
  "Southmere",
  "Twin Peaks",
  "Umberland",
  "Vista Verde",
  "Westhaven",
  "Yarrow",
  "Zenith Islands",
  "Atlas Bay",
  "Bluewater",
  "Coral State",
  "Dawnland",
  "Elm Coast",
  "Falcon Ridge",
  "Granite Union",
  "Highlandia",
  "Ivory Port",
  "Jade Republic",
  "Kestrel Bay",
  "Lagoon Isles",
  "Meadowland",
  "Northstar",
  "Orchard State",
  "Prairie Union",
  "Redwood",
  "Silver Coast",
  "Timberline",
  "Upper Vale",
  "Violet Bay",
  "Windmere",
  "Yorkfield",
] as const;

const groupLetters = Array.from({ length: 12 }, (_, index) =>
  String.fromCharCode(65 + index),
);

const statusBySeed: Record<number, TeamStatus> = {
  1: "qualified",
  2: "group",
  3: "group",
  4: "eliminated",
};

const reachedStageBySeed: Record<number, TournamentStage> = {
  1: "round-of-16",
  2: "group",
  3: "group",
  4: "group",
};

export const mockParticipants: MockParticipant[] = participants.map(
  (name, index) => ({
    id: `participant-${index + 1}`,
    name,
    displayName: name,
    emailCaptured: index % 3 === 0,
  }),
);

const mockTeamPerformance = groupLetters.flatMap((group, groupIndex) =>
  Array.from({ length: 4 }, (_, seedIndex) => {
    const teamIndex = groupIndex * 4 + seedIndex;
    const seed = seedIndex + 1;
    const participant = mockParticipants[teamIndex % mockParticipants.length];
    const groupStageWins = seed === 1 ? 2 : seed === 2 ? 1 : 0;
    const groupStageDraws = seed === 1 ? groupIndex % 2 : seed === 3 ? 2 : 0;
    const reachedStage =
      seed === 1 && groupIndex < 2 ? "quarter-final" : reachedStageBySeed[seed];
    const eliminatedOrder =
      seed === 4 ? groupIndex + 1 : seed === 3 && groupIndex < 3 ? 20 + groupIndex : null;

    return {
      id: `team-${group.toLowerCase()}-${seed}`,
      name: mockNationNames[teamIndex],
      shortName: mockNationNames[teamIndex]
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
      group,
      seed,
      status: statusBySeed[seed],
      groupStageWins,
      groupStageDraws,
      reachedStage,
      goalsFor: Math.max(0, 7 - seed + (groupIndex % 3)),
      goalsAgainst: seed + (groupIndex % 2),
      cards: seed === 4 ? null : seed + (groupIndex % 4),
      eliminatedOrder,
      allocatedTo: participant.id,
    };
  }),
);

const scoreByTeam = new Map(
  calculateTeamScores(
    mockTeamPerformance.map((team) => ({
      teamId: team.id,
      name: team.name,
      groupStageWins: team.groupStageWins,
      groupStageDraws: team.groupStageDraws,
      reachedStage: team.reachedStage,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      cards: team.cards,
      eliminatedOrder: team.eliminatedOrder,
    })),
  ).map((score) => [score.teamId, score]),
);

export const mockTeams: MockTeam[] = mockTeamPerformance.map((team) => ({
  ...team,
  points: scoreByTeam.get(team.id)?.points ?? 0,
}));

export const mockMatches: MockMatch[] = [
  {
    id: "match-001",
    stage: "Group",
    status: "final",
    homeTeamId: "team-a-1",
    awayTeamId: "team-a-2",
    homeScore: 2,
    awayScore: 1,
    kickoffLabel: "Matchday 1",
    freshness: "final",
  },
  {
    id: "match-002",
    stage: "Group",
    status: "final",
    homeTeamId: "team-b-1",
    awayTeamId: "team-b-3",
    homeScore: 1,
    awayScore: 1,
    kickoffLabel: "Matchday 1",
    freshness: "final",
  },
  {
    id: "match-003",
    stage: "Group",
    status: "delayed",
    homeTeamId: "team-c-2",
    awayTeamId: "team-c-4",
    homeScore: null,
    awayScore: null,
    kickoffLabel: "Awaiting confirmation",
    freshness: "delayed",
  },
  {
    id: "match-004",
    stage: "Group",
    status: "scheduled",
    homeTeamId: "team-d-1",
    awayTeamId: "team-d-4",
    homeScore: null,
    awayScore: null,
    kickoffLabel: "Tomorrow",
    freshness: "scheduled",
  },
  {
    id: "match-005",
    stage: "Round of 16",
    status: "scheduled",
    homeTeamId: "team-a-1",
    awayTeamId: "team-b-2",
    homeScore: null,
    awayScore: null,
    kickoffLabel: "Future bracket",
    freshness: "scheduled",
  },
  {
    id: "match-006",
    stage: "Quarter-final",
    status: "scheduled",
    homeTeamId: "team-c-1",
    awayTeamId: "team-d-1",
    homeScore: null,
    awayScore: null,
    kickoffLabel: "Future bracket",
    freshness: "scheduled",
  },
];

const mockBadgeCategories = [
  {
    id: "badge-first",
    key: "first-place",
    label: "1st Place",
    status: "active",
    supportLine: "Highest mock participant total.",
  },
  {
    id: "badge-second",
    key: "second-place",
    label: "2nd Place",
    status: "active",
    supportLine: "Shared ranks are supported when totals match.",
  },
  {
    id: "badge-third",
    key: "third-place",
    label: "3rd Place",
    status: "active",
    supportLine: "Calculated from deterministic shared ranks.",
  },
  {
    id: "badge-fourth",
    key: "fourth-place",
    label: "4th Place",
    status: "active",
    supportLine: "Calculated from deterministic shared ranks.",
  },
  {
    id: "badge-wooden-spoon",
    key: "wooden-spoon",
    label: "Wooden Spoon",
    status: "active",
    supportLine: "Lowest mock participant total.",
  },
  {
    id: "badge-first-knocked-out",
    key: "first-knocked-out",
    label: "First Knocked Out",
    status: "active",
    supportLine: "Calculated from cached elimination order.",
  },
  {
    id: "badge-most-goals-conceded",
    key: "most-goals-conceded",
    label: "Most Goals Conceded",
    status: "active",
    supportLine: "Calculated from cached goals-against totals.",
  },
  {
    id: "badge-fewest-goals-scored",
    key: "fewest-goals-scored",
    label: "Fewest Goals Scored",
    status: "active",
    supportLine: "Calculated from cached goals-for totals.",
  },
  {
    id: "badge-most-cards",
    key: "most-cards",
    label: "Most Cards",
    status: "manual-future",
    supportLine: "Marked manual/future for the free data tier.",
  },
] satisfies Array<
  Omit<MockBadge, "holderParticipantIds"> & Pick<BadgeCategoryInput, "key">
>;

export const mockBadges: MockBadge[] = mockBadgeCategories.map((category) => ({
  ...category,
  holderParticipantIds: getBadgeParticipantHolders(category.id),
}));

export function getTeamName(teamId: string) {
  return mockTeams.find((team) => team.id === teamId)?.name ?? "Unknown team";
}

export function getParticipantStandings(): ParticipantStanding[] {
  return calculateParticipantScores(
    mockParticipants.map((participant) => ({
      id: participant.id,
      name: participant.displayName,
    })),
    mockTeams.map((team) => ({
      participantId: team.allocatedTo,
      teamId: team.id,
    })),
    calculateTeamScores(
      mockTeams.map((team) => ({
        teamId: team.id,
        name: team.name,
        groupStageWins: team.groupStageWins,
        groupStageDraws: team.groupStageDraws,
        reachedStage: team.reachedStage,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        cards: team.cards,
        eliminatedOrder: team.eliminatedOrder,
      })),
    ),
  ).map((standing) => ({
    ...standing,
    teamNames: standing.teamIds.map(getTeamName),
  }));
}

export const mockDataSummary = {
  teamCount: mockTeams.length,
  participantCount: mockParticipants.length,
  matchCount: mockMatches.length,
  badgeCount: mockBadges.length,
  allocationSpread: {
    min: Math.min(
      ...mockParticipants.map(
        (participant) =>
          mockTeams.filter((team) => team.allocatedTo === participant.id).length,
      ),
    ),
    max: Math.max(
      ...mockParticipants.map(
        (participant) =>
          mockTeams.filter((team) => team.allocatedTo === participant.id).length,
      ),
    ),
  },
} as const;

function getBadgeParticipantHolders(badgeCategoryId: string) {
  const standings = getParticipantStandings();
  const holders = calculateBadgeHolders({
    categories: mockBadgeCategories.map((category) => ({
      id: category.id,
      key: category.key,
      label: category.label,
      status: category.status,
    })),
    participantScores: standings.map((standing) => ({
      participantId: standing.participantId,
      name: standing.name,
      rank: standing.rank,
      points: standing.points,
      teamCount: standing.teamCount,
      teamIds: mockTeams
        .filter((team) => team.allocatedTo === standing.participantId)
        .map((team) => team.id),
    })),
    teams: mockTeams.map((team) => ({
      teamId: team.id,
      name: team.name,
      groupStageWins: team.groupStageWins,
      groupStageDraws: team.groupStageDraws,
      reachedStage: team.reachedStage,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      cards: team.cards,
      eliminatedOrder: team.eliminatedOrder,
    })),
    allocations: mockTeams.map((team) => ({
      participantId: team.allocatedTo,
      teamId: team.id,
    })),
  });

  return [
    ...new Set(
      holders
        .filter((holder) => holder.badgeCategoryId === badgeCategoryId)
        .map((holder) => holder.participantId)
        .filter((participantId): participantId is string => Boolean(participantId)),
    ),
  ];
}
