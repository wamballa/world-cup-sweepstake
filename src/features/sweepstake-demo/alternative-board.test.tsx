import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

import { AlternativeBoard } from "./alternative-board";

describe("AlternativeBoard", () => {
  it("renders the three validation tabs", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(screen.getByRole("tab", { name: "Luck of the Draw" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fair Play" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Teams" })).toBeInTheDocument();
  });

  it("renders Luck of the Draw with official total points and change", () => {
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        officialMovementByParticipantId={{ andy: "+2", jobin: "-1" }}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Change" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total points" })).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("renders Fair Play with average points and change", () => {
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        alternativeMovementByParticipantId={{ andy: "+3" }}
        initialTab="fair"
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Average points" })).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("41.5")).toBeInTheDocument();
  });

  it("renders Teams with team stats columns", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("GF")).toBeInTheDocument();
    expect(screen.getByText("GA")).toBeInTheDocument();
    expect(screen.getByText("GD")).toBeInTheDocument();
    expect(screen.getByLabelText("W: Wins")).toHaveAttribute("title", "W = Wins");
    expect(
      screen.getByLabelText("GD: Goal Difference"),
    ).toHaveAttribute("title", "GD = Goal Difference");
    expect(
      screen.queryByRole("columnheader", { name: "Next fixture" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("keeps tab navigation and table headers sticky", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    const stickyControls = screen.getByTestId("sticky-board-controls");

    expect(stickyControls).toHaveClass("sticky");
    expect(stickyControls).toHaveClass("top-0");
    expect(stickyControls).not.toHaveClass("top-11");
    expect(screen.getByRole("columnheader", { name: "Rank" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Stage/status" }),
    ).toBeInTheDocument();
  });

  it("does not use sticky table header offsets", () => {
    const { container } = renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    expect(container.innerHTML).not.toContain("top-11");
  });
});

function renderAlternativeBoard(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

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
    standings: [
      {
        participantId: "jobin",
        name: "Jobin",
        rank: 1,
        points: 83,
        teamCount: 2,
        teamNames: ["Norway", "Scotland"],
        teamIds: ["norway", "scotland"],
      },
      {
        participantId: "andy",
        name: "Andy",
        rank: 2,
        points: 74,
        teamCount: 1,
        teamNames: ["Japan"],
        teamIds: ["japan"],
      },
    ],
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
    matches: [
      {
        id: "match-1",
        stage: "Group",
        status: "final",
        homeTeamId: "japan",
        awayTeamId: "norway",
        homeTeamName: "Japan",
        awayTeamName: "Norway",
        homeParticipantName: "Andy",
        awayParticipantName: "Jobin",
        participantLabel: "Andy & Jobin",
        homeScore: 2,
        awayScore: 1,
        kickoffAt: "2026-06-17T12:00:00.000Z",
        kickoffLabel: "17 Jun 2026, 12:00",
        freshness: "cached",
      },
    ],
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
