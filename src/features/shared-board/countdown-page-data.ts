import type {
  SharedBoardData,
  SharedBoardMatch,
  SharedBoardTeam,
} from "@/features/shared-board/shared-board-data";

export type CountdownAllocation = {
  participantId: string;
  participantName: string;
  teamId: string;
  teamName: string;
  teamShortName: string;
  flagAssetPath: string | null;
  firstMatch: {
    kickoffAt: string | null;
    kickoffLabel: string;
    opponentTeamName: string;
    opponentParticipantName: string | null;
    participantLabel: string;
    stage: string;
    status: SharedBoardMatch["status"];
  } | null;
};

export type CountdownParticipantAllocation = {
  participantId: string;
  participantName: string;
  teams: CountdownAllocation[];
};

export function getTournamentCountdownTarget(boardData: SharedBoardData) {
  return (
    [...boardData.matches]
      .filter((match) => match.kickoffAt)
      .sort(sortTeamMatches)[0]?.kickoffAt ??
    (boardData.tournamentCode === "WC_2026" ? "2026-06-11T00:00:00Z" : null)
  );
}

export function buildCountdownAllocations(
  boardData: SharedBoardData,
): CountdownAllocation[] {
  return boardData.standings.flatMap((standing) => {
    const allocatedTeams = boardData.teams
      .filter((team) => team.allocatedTo === standing.participantId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return allocatedTeams.map((team) => ({
      participantId: standing.participantId,
      participantName: standing.name,
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      flagAssetPath: team.flagAssetPath,
      firstMatch: buildFirstMatch(team, boardData.matches),
    }));
  });
}

export function buildCountdownParticipantAllocations(
  boardData: SharedBoardData,
): CountdownParticipantAllocation[] {
  const allocations = buildCountdownAllocations(boardData);
  const allocationsByParticipant = new Map<string, CountdownAllocation[]>();

  for (const allocation of allocations) {
    const existing = allocationsByParticipant.get(allocation.participantId) ?? [];
    existing.push(allocation);
    allocationsByParticipant.set(allocation.participantId, existing);
  }

  return boardData.standings.map((standing) => ({
    participantId: standing.participantId,
    participantName: standing.name,
    teams: (allocationsByParticipant.get(standing.participantId) ?? []).sort(
      (a, b) => a.teamName.localeCompare(b.teamName),
    ),
  }));
}

function buildFirstMatch(team: SharedBoardTeam, matches: SharedBoardMatch[]) {
  const firstMatch = matches
    .filter(
      (match) => match.homeTeamId === team.id || match.awayTeamId === team.id,
    )
    .sort(sortTeamMatches)[0];

  if (!firstMatch) {
    return null;
  }

  const isHomeTeam = firstMatch.homeTeamId === team.id;

  return {
    kickoffAt: firstMatch.kickoffAt,
    kickoffLabel: firstMatch.kickoffLabel,
    opponentTeamName: isHomeTeam
      ? firstMatch.awayTeamName
      : firstMatch.homeTeamName,
    opponentParticipantName: isHomeTeam
      ? firstMatch.awayParticipantName
      : firstMatch.homeParticipantName,
    participantLabel: firstMatch.participantLabel,
    stage: firstMatch.stage,
    status: firstMatch.status,
  };
}

function sortTeamMatches(a: SharedBoardMatch, b: SharedBoardMatch) {
  if (a.kickoffAt && b.kickoffAt) {
    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  }

  if (a.kickoffAt && !b.kickoffAt) {
    return -1;
  }

  if (!a.kickoffAt && b.kickoffAt) {
    return 1;
  }

  return a.stage.localeCompare(b.stage) || a.homeTeamName.localeCompare(b.homeTeamName);
}
