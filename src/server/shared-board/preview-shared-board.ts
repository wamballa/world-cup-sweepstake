import "server-only";

import {
  getParticipantStandings,
  getTeamName,
  mockBadges,
  mockMatches,
  mockParticipants,
  mockTeams,
} from "@/features/mock-data/world-cup-2026";
import type {
  SharedBoardData,
  SharedBoardTeamStatus,
} from "@/features/shared-board/shared-board-data";

const previewSweepstakeName = "Friday Office Draw";

export function createPreviewSharedBoardData(): SharedBoardData {
  const standings = getParticipantStandings().map((standing) => ({
    ...standing,
    teamIds: mockTeams
      .filter((team) => team.allocatedTo === standing.participantId)
      .map((team) => team.id),
  }));
  const participants = mockParticipants.map((participant) => ({
    id: participant.id,
    name: participant.displayName,
    emailUpdatesEnabled: participant.emailCaptured,
  }));
  const teams = mockTeams.map((team) => {
    const allocatedParticipant =
      participants.find((participant) => participant.id === team.allocatedTo) ??
      null;

    return {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      group: team.group,
      status: (team.status === "qualified"
        ? "round-of-16"
        : team.status) as SharedBoardTeamStatus,
      points: team.points,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      allocatedTo: team.allocatedTo,
      allocatedToName: allocatedParticipant?.name ?? null,
      flagAssetPath: null,
    };
  });
  const matches = mockMatches.map((match) => ({
    id: match.id,
    stage: match.stage,
    status: match.status,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeamName: getTeamName(match.homeTeamId),
    awayTeamName: getTeamName(match.awayTeamId),
    homeParticipantName: getPreviewParticipantNameForTeam(match.homeTeamId),
    awayParticipantName: getPreviewParticipantNameForTeam(match.awayTeamId),
    participantLabel: formatPreviewParticipants(
      getPreviewParticipantNameForTeam(match.homeTeamId),
      getPreviewParticipantNameForTeam(match.awayTeamId),
    ),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    kickoffAt: null,
    kickoffLabel: match.kickoffLabel,
    freshness: match.freshness,
  }));

  return {
    sweepstakeId: "preview",
    sweepstakeName: previewSweepstakeName,
    tournamentCode: "WC_2026",
    sharedViewMode: "participant_board",
    participants,
    standings,
    teams,
    matches,
    badges: mockBadges
      .filter((badge) => badge.status !== "manual-future")
      .map((badge) => ({
        id: badge.id,
        label: badge.label,
        status: badge.status,
        holderParticipantIds: badge.holderParticipantIds,
        supportLine: badge.supportLine,
      })),
    syncState: {
      lastSuccessfulSyncAt: null,
      freshnessLabel: "Preview data",
    },
    summary: {
      leaderName: standings[0]?.name ?? null,
      finalMatchCount: matches.filter((match) => match.status === "final").length,
      delayedMatchCount: matches.filter((match) => match.status === "delayed").length,
      scheduledMatchCount: matches.filter((match) => match.status === "scheduled").length,
      totalGoals: teams.reduce((total, team) => total + team.goalsFor, 0),
      activeTeamCount: teams.filter((team) => team.status !== "eliminated").length,
      hasFinalMatches: matches.some((match) => match.status === "final"),
    },
  };
}

function getPreviewParticipantNameForTeam(teamId: string) {
  const allocatedTeam = mockTeams.find((team) => team.id === teamId);

  if (!allocatedTeam) {
    return null;
  }

  return (
    mockParticipants.find(
      (participant) => participant.id === allocatedTeam.allocatedTo,
    )?.displayName ?? null
  );
}

function formatPreviewParticipants(
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
