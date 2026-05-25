export function parseBulkParticipantNames(input: string) {
  return input
    .split(/[,\r\n]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function getDuplicateBulkParticipantNames(names: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  names.forEach((name) => {
    const key = name.trim().toLowerCase();

    if (!key) {
      return;
    }

    if (seen.has(key)) {
      duplicates.add(name.trim());
      return;
    }

    seen.add(key);
  });

  return [...duplicates];
}

export function prepareBulkParticipantCreate({
  existingParticipants,
  names,
}: {
  existingParticipants: Array<{ displayName: string; sortOrder: number | null }>;
  names: string[];
}) {
  const cleanNames = names
    .map((name) => name.trim())
    .filter(Boolean)
    .map(normalizeBulkParticipantName);
  const duplicatePastedName = getDuplicateBulkParticipantNames(cleanNames)[0];

  if (duplicatePastedName) {
    throw new Error(`Duplicate pasted participant: ${duplicatePastedName}.`);
  }

  const existingNames = new Set(
    existingParticipants.map((participant) =>
      participant.displayName.trim().toLowerCase(),
    ),
  );
  const existingDuplicate = cleanNames.find((name) =>
    existingNames.has(name.toLowerCase()),
  );

  if (existingDuplicate) {
    throw new Error(`Another participant already uses that name: ${existingDuplicate}.`);
  }

  const nextSortOrder =
    existingParticipants.reduce((highest, participant) => {
      const sortOrder = Number(participant.sortOrder);
      return Number.isFinite(sortOrder) ? Math.max(highest, sortOrder) : highest;
    }, -1) + 1;

  return {
    names: cleanNames,
    nextSortOrder,
  };
}

function normalizeBulkParticipantName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Participant name is required.");
  }

  if (normalizedName.length > 80) {
    throw new Error("Participant name must be 80 characters or fewer.");
  }

  return normalizedName;
}
