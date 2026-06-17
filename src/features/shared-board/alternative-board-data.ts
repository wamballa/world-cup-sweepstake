import type { SharedBoardData } from "./shared-board-data";

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
  status: string;
  nextFixture: string;
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
        nextFixture: nextMatch ? formatNextFixture(nextMatch) : "-",
      };
    });
  const sortedRows = rows.sort(
    (a, b) => b.points - a.points || a.teamName.localeCompare(b.teamName),
  );
  let lastPoints: number | null = null;
  let lastRank = 0;

  return sortedRows.map((row, index) => {
    if (row.points !== lastPoints) {
      lastRank = index + 1;
      lastPoints = row.points;
    }

    return {
      ...row,
      rank: lastRank,
    };
  });
}

function roundAlternativeScore(score: number) {
  return Math.round(score * 10) / 10;
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

function formatNextFixture(match: SharedBoardData["matches"][number]) {
  return `${match.homeTeamName} v ${match.awayTeamName} (${match.kickoffLabel})`;
}
