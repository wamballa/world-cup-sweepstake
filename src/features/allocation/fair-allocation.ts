export type AllocationParticipant = {
  id: string;
  name: string;
};

export type AllocationTeam = {
  id: string;
  name: string;
  shortName?: string;
};

export type TeamAllocation = {
  participantId: string;
  teamId: string;
};

export type AllocationAudit = {
  id: string;
  action: "initial-draw" | "rerun" | "manual-move";
  actor: string;
  createdAt: string;
  note: string;
};

type RandomSource = () => number;

export function createFairAllocation(
  participants: AllocationParticipant[],
  teams: AllocationTeam[],
  random: RandomSource = Math.random,
): TeamAllocation[] {
  if (participants.length === 0) {
    throw new Error("At least one participant is required.");
  }

  if (teams.length === 0) {
    throw new Error("At least one team is required.");
  }

  const shuffledParticipants = shuffle(participants, random);
  const shuffledTeams = shuffle(teams, random);
  const baseTeamCount = Math.floor(teams.length / participants.length);
  const extraTeamCount = teams.length % participants.length;
  const allocations: TeamAllocation[] = [];
  let teamCursor = 0;

  shuffledParticipants.forEach((participant, participantIndex) => {
    const targetTeamCount =
      baseTeamCount + (participantIndex < extraTeamCount ? 1 : 0);

    for (let index = 0; index < targetTeamCount; index += 1) {
      const team = shuffledTeams[teamCursor];

      if (team) {
        allocations.push({
          participantId: participant.id,
          teamId: team.id,
        });
      }

      teamCursor += 1;
    }
  });

  return allocations;
}

export function moveAllocatedTeam(
  allocations: TeamAllocation[],
  teamId: string,
  destinationParticipantId: string,
): TeamAllocation[] {
  if (!allocations.some((allocation) => allocation.teamId === teamId)) {
    throw new Error("Team is not allocated.");
  }

  return allocations.map((allocation) =>
    allocation.teamId === teamId
      ? { ...allocation, participantId: destinationParticipantId }
      : allocation,
  );
}

export function getAllocationSpread(
  participantIds: string[],
  allocations: TeamAllocation[],
) {
  const counts = participantIds.map(
    (participantId) =>
      allocations.filter((allocation) => allocation.participantId === participantId)
        .length,
  );

  return {
    min: Math.min(...counts),
    max: Math.max(...counts),
  };
}

export function validateCompleteAllocation(
  participants: AllocationParticipant[],
  teams: AllocationTeam[],
  allocations: TeamAllocation[],
) {
  const participantIds = new Set(participants.map((participant) => participant.id));
  const teamIds = new Set(teams.map((team) => team.id));
  const allocatedTeamIds = new Set(allocations.map((allocation) => allocation.teamId));

  if (allocations.length !== teams.length) {
    return false;
  }

  if (allocatedTeamIds.size !== teams.length) {
    return false;
  }

  return allocations.every(
    (allocation) =>
      participantIds.has(allocation.participantId) &&
      teamIds.has(allocation.teamId),
  );
}

export function createAllocationAudit(
  action: AllocationAudit["action"],
  note: string,
  actor = "Current admin",
): AllocationAudit {
  return {
    id: `${action}-${Date.now()}`,
    action,
    actor,
    createdAt: new Date().toISOString(),
    note,
  };
}

function shuffle<T>(items: T[], random: RandomSource) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
