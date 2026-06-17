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

function roundAlternativeScore(score: number) {
  return Math.round(score * 10) / 10;
}
