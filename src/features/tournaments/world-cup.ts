export type FootballDataTournament = {
  code: string;
  season: number;
  label: string;
  competitionCode: string;
  validationNote?: string;
};

export const footballDataTournaments = [
  {
    code: "WC_2026",
    season: 2026,
    label: "FIFA World Cup 2026",
    competitionCode: "WC",
  },
  {
    code: "PL_2024",
    season: 2024,
    label: "Premier League 2024/25 validation",
    competitionCode: "PL",
    validationNote:
      "Completed free-tier validation dataset for draw, scoring, badges, matches, and stats checks.",
  },
] as const satisfies readonly FootballDataTournament[];

export const defaultFootballDataTournament = footballDataTournaments[0];

export function getFootballDataTournamentByCode(tournamentCode: string) {
  return (
    footballDataTournaments.find((tournament) => tournament.code === tournamentCode) ??
    defaultFootballDataTournament
  );
}

export function isSupportedFootballDataTournamentCode(tournamentCode: string) {
  return footballDataTournaments.some(
    (tournament) => tournament.code === tournamentCode,
  );
}

export const worldCupTournaments = footballDataTournaments;
export const defaultWorldCupTournament = defaultFootballDataTournament;
export const getWorldCupTournamentByCode = getFootballDataTournamentByCode;
export const isSupportedWorldCupTournamentCode =
  isSupportedFootballDataTournamentCode;
