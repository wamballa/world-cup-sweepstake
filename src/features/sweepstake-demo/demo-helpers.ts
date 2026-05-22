import type { TeamAllocation } from "@/features/allocation/fair-allocation";
import type { DrawTeam, ParticipantDraft } from "./types";

export function parseParticipants(
  participantText: string,
  emailsByName: Record<string, string>,
): ParticipantDraft[] {
  return participantText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `participant-${slugify(name)}-${index}`,
      name,
      email: emailsByName[name] ?? "",
    }));
}

export function getDuplicateNames(participants: ParticipantDraft[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  participants.forEach((participant) => {
    const key = participant.name.toLowerCase();

    if (seen.has(key)) {
      duplicates.add(participant.name);
    }

    seen.add(key);
  });

  return [...duplicates];
}

export function getProjectedSpread(participantCount: number, teamCount: number) {
  if (participantCount === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.floor(teamCount / participantCount),
    max: Math.ceil(teamCount / participantCount),
  };
}

export function formatParticipantCapacity(
  participantCount: number,
  teamCount: number,
) {
  return teamCount > 0
    ? `${participantCount}/${teamCount}`
    : String(participantCount);
}

export function getParticipantTeamCount(
  participantId: string,
  allocations: TeamAllocation[],
) {
  return allocations.filter((allocation) => allocation.participantId === participantId)
    .length;
}

export function getTeamsForParticipant(
  participantId: string,
  allocations: TeamAllocation[],
  teams: DrawTeam[],
) {
  const teamIds = allocations
    .filter((allocation) => allocation.participantId === participantId)
    .map((allocation) => allocation.teamId);

  return teams.filter((team) => teamIds.includes(team.id));
}

export function getLocalTeamName(teamId: string, teams: DrawTeam[]) {
  return teams.find((team) => team.id === teamId)?.name ?? "Unknown team";
}

export function getParticipantName(
  participantId: string,
  participants: ParticipantDraft[],
) {
  return (
    participants.find((participant) => participant.id === participantId)?.name ??
    "Unknown participant"
  );
}

export function createPreviewShareToken() {
  return "preview-v7m4q2x9c8p6n3r5t1w0y4k7";
}

export function getStepState(index: number, allocationCount: number) {
  if (index < 4) {
    return "Ready";
  }

  if (index === 4) {
    return allocationCount > 0 ? "Done" : "Ready";
  }

  return allocationCount > 0 ? "Ready" : "Locked";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}
