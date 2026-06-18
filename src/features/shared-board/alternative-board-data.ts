import type { SharedBoardData, SharedBoardTeamStatus } from "./shared-board-data";

export type AlternativeBoardRow = {
  participantId: string;
  name: string;
  rank: number;
  totalOfficialTeamScore: number;
  assignedTeamCount: number;
  alternativeScore: number;
  displayAlternativeScore: string;
  teamNames: string[];
  teamIds: string[];
};

export type AlternativeTeamBoardRow = {
  teamId: string;
  rank: number;
  teamName: string;
  ownerName: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  status: SharedBoardTeamStatus;
  nextFixture: string;
};

export type AlternativeBadgeRow = {
  id: string;
  label: string;
  status: "active" | "undecided" | "manual-future";
  holderLabels: string[];
  supportLine: string;
};

export function buildAlternativeBoardRows(
  boardData: SharedBoardData,
): AlternativeBoardRow[] {
  const rows = boardData.participants.map((participant) => {
    const assignedTeams = boardData.teams.filter(
      (team) => team.allocatedTo === participant.id,
    );
    const totalOfficialTeamScore = assignedTeams.reduce(
      (total, team) => total + team.points,
      0,
    );
    const assignedTeamCount = assignedTeams.length;
    const alternativeScore =
      assignedTeamCount > 0 ? totalOfficialTeamScore / assignedTeamCount : 0;

    return {
      participantId: participant.id,
      name: participant.name,
      totalOfficialTeamScore,
      assignedTeamCount,
      alternativeScore,
      roundedAlternativeScore: roundAlternativeScore(alternativeScore),
      displayAlternativeScore: formatAlternativeScore(alternativeScore),
      teamNames: assignedTeams.map((team) => team.name),
      teamIds: assignedTeams.map((team) => team.id),
    };
  });

  const sortedRows = rows.sort(
    (a, b) =>
      b.roundedAlternativeScore - a.roundedAlternativeScore ||
      a.name.localeCompare(b.name),
  );
  let lastRoundedScore: number | null = null;
  let lastRank = 0;

  return sortedRows.map((row, index) => {
    if (row.roundedAlternativeScore !== lastRoundedScore) {
      lastRank = index + 1;
      lastRoundedScore = row.roundedAlternativeScore;
    }

    return {
      participantId: row.participantId,
      name: row.name,
      totalOfficialTeamScore: row.totalOfficialTeamScore,
      assignedTeamCount: row.assignedTeamCount,
      alternativeScore: row.alternativeScore,
      displayAlternativeScore: row.displayAlternativeScore,
      teamNames: row.teamNames,
      teamIds: row.teamIds,
      rank: lastRank,
    };
  });
}

export function buildAlternativeBadgeRows(
  boardData: SharedBoardData,
): AlternativeBadgeRow[] {
  const teamRows = buildAlternativeTeamBoardRows(boardData);

  return boardData.badges.map((badge) => {
    const holder = findAlternativeBadgeHolder(
      normalizeBadgeLabel(badge.label),
      teamRows,
      boardData.matches,
    );

    return {
      id: badge.id,
      label: badge.label,
      status: badge.status,
      holderLabels: holder ? [formatTeamHolderLabel(holder)] : [],
      supportLine:
        alternativeBadgeSupportLines[normalizeBadgeLabel(badge.label)] ??
        badge.supportLine,
    };
  });
}

const alternativeBadgeSupportLines: Record<string, string> = {
  "first-place": "Top scoring team.",
  "second-place": "Second highest scoring team.",
  "third-place": "Third highest scoring team.",
  "fourth-place": "Fourth highest scoring team.",
  "wooden-spoon": "Lowest scoring team.",
  "first-knocked-out": "First team eliminated.",
  "most-goals-conceded": "Team with the most goals conceded.",
  "fewest-goals-scored": "Team with the fewest goals scored.",
};

function findAlternativeBadgeHolder(
  badgeKey: string,
  teamRows: AlternativeTeamBoardRow[],
  matches: SharedBoardData["matches"],
) {
  switch (badgeKey) {
    case "first-place":
      return teamRows[0] ?? null;
    case "second-place":
      return teamRows[1] ?? null;
    case "third-place":
      return teamRows[2] ?? null;
    case "fourth-place":
      return teamRows[3] ?? null;
    case "wooden-spoon":
      return teamRows.at(-1) ?? null;
    case "first-knocked-out":
      return null;
    case "most-goals-conceded":
      return findMetricLeader(teamRows, (team) => team.goalsAgainst, "max");
    case "fewest-goals-scored":
      return findMetricLeader(
        teamRows.filter((team) => teamHasFinalMatch(team.teamId, matches)),
        (team) => team.goalsFor,
        "min",
      );
    default:
      return null;
  }
}

function findMetricLeader(
  teamRows: AlternativeTeamBoardRow[],
  metric: (team: AlternativeTeamBoardRow) => number,
  mode: "max" | "min",
) {
  if (teamRows.length === 0) {
    return null;
  }

  const targetValue =
    mode === "max"
      ? Math.max(...teamRows.map(metric))
      : Math.min(...teamRows.map(metric));

  return teamRows.find((team) => metric(team) === targetValue) ?? null;
}

function teamHasFinalMatch(
  teamId: string,
  matches: SharedBoardData["matches"],
) {
  return matches.some(
    (match) =>
      match.status === "final" &&
      (match.homeTeamId === teamId || match.awayTeamId === teamId),
  );
}

function formatTeamHolderLabel(team: AlternativeTeamBoardRow) {
  return `${team.ownerName} (${team.teamName})`;
}

function normalizeBadgeLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/1st/, "first")
    .replace(/2nd/, "second")
    .replace(/3rd/, "third")
    .replace(/4th/, "fourth")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^first-place$/, "first-place")
    .replace(/^second-place$/, "second-place")
    .replace(/^third-place$/, "third-place")
    .replace(/^fourth-place$/, "fourth-place");
}

export function formatAlternativeScore(score: number) {
  const roundedScore = roundAlternativeScore(score);

  return Number.isInteger(roundedScore)
    ? String(roundedScore)
    : roundedScore.toFixed(1);
}

export function buildAlternativeTeamBoardRows(
  boardData: SharedBoardData,
): AlternativeTeamBoardRow[] {
  const rows = boardData.teams
    .filter((team) => team.allocatedTo)
    .map((team) => {
      const finalMatches = boardData.matches.filter(
        (match) =>
          match.status === "final" &&
          (match.homeTeamId === team.id || match.awayTeamId === team.id),
      );
      const nextMatch = boardData.matches
        .filter(
          (match) =>
            match.status !== "final" &&
            (match.homeTeamId === team.id || match.awayTeamId === team.id),
        )
        .sort(sortByKickoff)[0];
      const record = finalMatches.reduce(
        (total, match) => {
          const goalsFor = getGoalsFor(team.id, match);
          const goalsAgainst = getGoalsAgainst(team.id, match);

          return {
            wins: total.wins + (goalsFor > goalsAgainst ? 1 : 0),
            draws: total.draws + (goalsFor === goalsAgainst ? 1 : 0),
            losses: total.losses + (goalsFor < goalsAgainst ? 1 : 0),
            goalsFor: total.goalsFor + goalsFor,
            goalsAgainst: total.goalsAgainst + goalsAgainst,
          };
        },
        {
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        },
      );

      return {
        teamId: team.id,
        teamName: team.name,
        ownerName: team.allocatedToName ?? "Unallocated",
        wins: record.wins,
        draws: record.draws,
        losses: record.losses,
        goalsFor: record.goalsFor,
        goalsAgainst: record.goalsAgainst,
        goalDifference: record.goalsFor - record.goalsAgainst,
        points: team.points,
        status: team.status,
        nextFixture: nextMatch ? formatNextFixture(team.id, nextMatch) : "-",
      };
    });
  const sortedRows = rows.sort(sortAlternativeTeamRows);

  return sortedRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function roundAlternativeScore(score: number) {
  return Math.round(score * 10) / 10;
}

const teamStatusSortOrder: Record<SharedBoardTeamStatus, number> = {
  winner: 6,
  "runner-up": 5,
  "semi-final": 4,
  "quarter-final": 3,
  "round-of-16": 2,
  group: 1,
  eliminated: 0,
};

function sortAlternativeTeamRows(
  a: Omit<AlternativeTeamBoardRow, "rank">,
  b: Omit<AlternativeTeamBoardRow, "rank">,
) {
  return (
    b.points - a.points ||
    teamStatusSortOrder[b.status] - teamStatusSortOrder[a.status] ||
    b.wins - a.wins ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.goalsAgainst - b.goalsAgainst ||
    a.teamName.localeCompare(b.teamName)
  );
}

function getGoalsFor(
  teamId: string,
  match: SharedBoardData["matches"][number],
) {
  if (match.homeTeamId === teamId) {
    return match.homeScore ?? 0;
  }

  if (match.awayTeamId === teamId) {
    return match.awayScore ?? 0;
  }

  return 0;
}

function getGoalsAgainst(
  teamId: string,
  match: SharedBoardData["matches"][number],
) {
  if (match.homeTeamId === teamId) {
    return match.awayScore ?? 0;
  }

  if (match.awayTeamId === teamId) {
    return match.homeScore ?? 0;
  }

  return 0;
}

function sortByKickoff(
  a: SharedBoardData["matches"][number],
  b: SharedBoardData["matches"][number],
) {
  if (a.kickoffAt && b.kickoffAt) {
    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  }

  if (a.kickoffAt) {
    return -1;
  }

  if (b.kickoffAt) {
    return 1;
  }

  return a.homeTeamName.localeCompare(b.homeTeamName);
}

function formatNextFixture(
  teamId: string,
  match: SharedBoardData["matches"][number],
) {
  const opponentName =
    match.homeTeamId === teamId ? match.awayTeamName : match.homeTeamName;

  return `v ${opponentName} (${match.kickoffLabel})`;
}
