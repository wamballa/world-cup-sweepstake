import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

import { AlternativeBoard } from "./alternative-board";

describe("AlternativeBoard", () => {
  it("renders the Change column with supplied movement values", () => {
    render(
      <AlternativeBoard
        boardData={boardData()}
        movementByParticipantId={{ andy: "+2", jobin: "-1" }}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Change" })).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("renders no movement when no movement value is supplied", () => {
    render(<AlternativeBoard boardData={boardData()} />);

    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});

function boardData(): SharedBoardData {
  return {
    sweepstakeId: "sweepstake-1",
    sweepstakeName: "Engineering",
    tournamentCode: "WC_2026",
    sharedViewMode: "participant_board",
    participants: [
      {
        id: "andy",
        name: "Andy",
        emailUpdatesEnabled: false,
      },
      {
        id: "jobin",
        name: "Jobin",
        emailUpdatesEnabled: false,
      },
    ],
    standings: [],
    teams: [
      team({
        id: "japan",
        name: "Japan",
        points: 74,
        allocatedTo: "andy",
        allocatedToName: "Andy",
      }),
      team({
        id: "norway",
        name: "Norway",
        points: 49,
        allocatedTo: "jobin",
        allocatedToName: "Jobin",
      }),
      team({
        id: "scotland",
        name: "Scotland",
        points: 34,
        allocatedTo: "jobin",
        allocatedToName: "Jobin",
      }),
    ],
    matches: [],
    badges: [],
    syncState: {
      lastSuccessfulSyncAt: "2026-06-17T12:00:00.000Z",
      freshnessLabel: "Checked 17 Jun 2026, 12:00 BST",
      freshnessStatus: "current",
      freshnessNotice: "Scores may be delayed by the data provider.",
    },
    summary: {
      leaderName: "Jobin",
      finalMatchCount: 0,
      delayedMatchCount: 0,
      scheduledMatchCount: 0,
      totalGoals: 0,
      activeTeamCount: 3,
      hasFinalMatches: false,
    },
  };
}

function team(overrides: Partial<SharedBoardData["teams"][number]>) {
  return {
    id: "team",
    name: "Team",
    shortName: "T",
    group: "A",
    status: "group" as const,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    allocatedTo: null,
    allocatedToName: null,
    flagAssetPath: null,
    ...overrides,
  };
}
