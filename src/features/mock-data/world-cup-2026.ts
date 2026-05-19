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
  goalsFor: number;
  goalsAgainst: number;
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

export const mockParticipants: MockParticipant[] = participants.map(
  (name, index) => ({
    id: `participant-${index + 1}`,
    name,
    displayName: name,
    emailCaptured: index % 3 === 0,
  }),
);

export const mockTeams: MockTeam[] = groupLetters.flatMap((group, groupIndex) =>
  Array.from({ length: 4 }, (_, seedIndex) => {
    const teamIndex = groupIndex * 4 + seedIndex;
    const seed = seedIndex + 1;
    const participant = mockParticipants[teamIndex % mockParticipants.length];
    const winBonus = seed === 1 ? 6 : seed === 2 ? 4 : seed === 3 ? 2 : 0;
    const progressBonus = seed === 1 && groupIndex < 4 ? 5 : 0;

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
      points: winBonus + progressBonus,
      goalsFor: Math.max(0, 7 - seed + (groupIndex % 3)),
      goalsAgainst: seed + (groupIndex % 2),
      allocatedTo: participant.id,
    };
  }),
);

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

export const mockBadges: MockBadge[] = [
  {
    id: "badge-first",
    label: "1st Place",
    status: "active",
    holderParticipantIds: ["participant-1"],
    supportLine: "Highest mock participant total.",
  },
  {
    id: "badge-second",
    label: "2nd Place",
    status: "active",
    holderParticipantIds: ["participant-2"],
    supportLine: "Shared ranks are supported when totals match.",
  },
  {
    id: "badge-wooden-spoon",
    label: "Wooden Spoon",
    status: "active",
    holderParticipantIds: ["participant-4"],
    supportLine: "Lowest mock participant total.",
  },
  {
    id: "badge-first-knocked-out",
    label: "First Knocked Out",
    status: "undecided",
    holderParticipantIds: [],
    supportLine: "Decided from cached elimination data later.",
  },
  {
    id: "badge-most-cards",
    label: "Most Cards",
    status: "manual-future",
    holderParticipantIds: [],
    supportLine: "Marked manual/future for the free data tier.",
  },
];

export function getTeamName(teamId: string) {
  return mockTeams.find((team) => team.id === teamId)?.name ?? "Unknown team";
}

export function getParticipantStandings(): ParticipantStanding[] {
  const totals = mockParticipants.map((participant) => {
    const teams = mockTeams.filter((team) => team.allocatedTo === participant.id);
    const points = teams.reduce((total, team) => total + team.points, 0);

    return {
      participantId: participant.id,
      name: participant.displayName,
      points,
      teamCount: teams.length,
      teamNames: teams.map((team) => team.name),
    };
  });

  const sorted = totals.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  let lastPoints: number | null = null;
  let lastRank = 0;

  return sorted.map((standing, index) => {
    if (standing.points !== lastPoints) {
      lastRank = index + 1;
      lastPoints = standing.points;
    }

    return { ...standing, rank: lastRank };
  });
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
