export type ParticipantDraft = {
  id: string;
  name: string;
  email: string;
};

export type DrawTeam = {
  id: string;
  name: string;
  shortName: string;
  groupName: string | null;
};

export type AllocationSpread = {
  min: number;
  max: number;
};
