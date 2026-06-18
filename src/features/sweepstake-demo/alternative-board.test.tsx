import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeAll, describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

import { AlternativeBoard } from "./alternative-board";
import { SharedScoreboard } from "./shared-scoreboard";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("AlternativeBoard", () => {
  it("renders the hidden board header from loaded board data", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(
      screen.getByText("Shared sweepstake board · v2.0"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Engineering" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("Teams").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Last Updated")).toBeInTheDocument();
    expect(screen.getByText("17 Jun 2026, 12:00")).toBeInTheDocument();
    expect(
      screen.queryByText("Checked 17 Jun 2026, 12:00 BST"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Updates")).not.toBeInTheDocument();
    expect(screen.queryByText("Views")).not.toBeInTheDocument();
    expect(screen.queryByText("6 tabs")).not.toBeInTheDocument();
  });

  it("renders the hidden board tabs without Fair Play", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(
      screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label")),
    ).toEqual(
      [
        "Participants",
        "Teams",
        "Badges",
        "Matches",
        "Stats",
        "Explainer",
      ],
    );
    expect(
      screen.queryByRole("tab", { name: "Fair Play" }),
    ).not.toBeInTheDocument();
  });

  it("renders a Participants column header on the hidden board", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    const participantsFrame = screen.getByTestId("participants-table-frame");

    expect(participantsFrame).toContainElement(
      screen.getByRole("columnheader", { name: "Rank" }),
    );
    expect(
      screen.getByRole("columnheader", { name: "Participant" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Total points" }),
    ).toBeInTheDocument();
    expect(within(participantsFrame).getByText("Jobin")).toBeInTheDocument();
  });

  it("makes hidden board tabs and Participants headers sticky", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(screen.getByTestId("shared-scoreboard-tabs")).toHaveClass(
      "sticky",
      "top-0",
    );
    expect(screen.getByTestId("participants-column-header")).toHaveClass(
      "sticky",
      "top-11",
    );
  });

  it("makes hidden board Teams and Matches headers sticky", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    expect(screen.getByTestId("teams-column-header")).toHaveClass(
      "sticky",
      "top-11",
    );
    expect(screen.getByTestId("teams-row-scroll")).not.toContainElement(
      screen.getByTestId("teams-column-header"),
    );

    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="matches" />,
    );

    expect(screen.getByTestId("matches-column-header")).toHaveClass(
      "sticky",
      "top-11",
    );
    expect(screen.getByTestId("matches-row-scroll")).not.toContainElement(
      screen.getByTestId("matches-column-header"),
    );
  });

  it("renders participant rank movement on the hidden board when provided", () => {
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        officialMovementByParticipantId={{
          jobin: "+1",
        }}
      />,
    );

    const participantsFrame = screen.getByTestId("participants-table-frame");

    expect(
      within(participantsFrame).getByRole("columnheader", { name: "Change" }),
    ).toBeInTheDocument();
    expect(within(participantsFrame).getByText("Pts")).toBeInTheDocument();
    expect(within(participantsFrame).getByText("Chg")).toBeInTheDocument();
    expect(within(participantsFrame).getByText("+1")).toBeInTheDocument();
    expect(within(participantsFrame).getAllByText("-").length).toBeGreaterThan(0);

    const jobinRow = within(participantsFrame)
      .getByText("Jobin")
      .closest('[role="row"]');

    expect(jobinRow).not.toBeNull();
    expect(within(jobinRow as HTMLElement).getByText("83")).toBeInTheDocument();
    expect(
      within(jobinRow as HTMLElement).getByText("2 teams"),
    ).toBeInTheDocument();
    expect(
      within(jobinRow as HTMLElement).getByText("+1"),
    ).toBeInTheDocument();
    expect(
      within(jobinRow as HTMLElement).queryByText("Change +1"),
    ).not.toBeInTheDocument();
  });

  it("removes participant sidebar cards from the hidden board", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(screen.queryByText("Choose your name")).not.toBeInTheDocument();
    expect(screen.queryByText("Email optional")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Your sweepstake")).not.toBeInTheDocument();
  });

  it("uses the leading Alternative Teams row for the hidden hero leader", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(screen.getByText("Leader")).toBeInTheDocument();
    expect(screen.getByText("Andy (Japan)")).toBeInTheDocument();
  });

  it("does not render the Fair Play average-score panel", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(
      screen.queryByRole("columnheader", { name: "Average points" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("41.5")).not.toBeInTheDocument();
  });

  it("renders Teams with team stats columns and abbreviation tooltips", async () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    expect(screen.getAllByText("W").length).toBeGreaterThan(0);
    expect(screen.getAllByText("D").length).toBeGreaterThan(0);
    expect(screen.getAllByText("L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GF").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GD").length).toBeGreaterThan(0);
    const winsHelp = screen.getByRole("button", { name: "W: Wins" });

    expect(winsHelp).toHaveAttribute(
      "title",
      "W = Wins",
    );
    expect(
      screen.getByRole("button", { name: "GD: Goal Difference" }),
    ).toHaveAttribute("title", "GD = Goal Difference");
    fireEvent.focus(winsHelp);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("W = Wins"),
    );
    expect(
      screen.getByRole("columnheader", { name: "Next fixture" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Stage" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Stage/status" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Japan").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("v Scotland (20 Jun 2026, 20:00)").length,
    ).toBeGreaterThan(0);
  });

  it("renders mobile cards for hidden board Teams", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    const mobileList = screen.getByTestId("teams-mobile-list");

    expect(within(mobileList).getByText("#1")).toBeInTheDocument();
    expect(within(mobileList).getByText("Japan")).toBeInTheDocument();
    expect(within(mobileList).getByText("Andy")).toBeInTheDocument();
    expect(within(mobileList).getAllByText("Pts").length).toBeGreaterThan(0);
    expect(within(mobileList).getAllByText("Stage").length).toBeGreaterThan(0);
    expect(
      within(mobileList).getAllByText("Next fixture").length,
    ).toBeGreaterThan(0);
  });

  it("renders live-board panels in the hidden board", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="badges" />,
    );

    expect(screen.getByText("1st Place")).toBeInTheDocument();
    expect(screen.getAllByText("Andy (Japan)").length).toBeGreaterThan(0);
    expect(screen.getByText("First Knocked Out")).toBeInTheDocument();
    expect(screen.getByText("No holder yet")).toBeInTheDocument();

    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="matches" />,
    );

    expect(screen.getAllByText("Japan v Norway").length).toBeGreaterThan(0);
    expect(screen.getByTestId("matches-mobile-list")).toBeInTheDocument();

    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="stats" />,
    );

    expect(screen.getByText("Goals")).toBeInTheDocument();

    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="explainer" />,
    );

    expect(screen.getByText("How scoring works")).toBeInTheDocument();
  });

  it("renders team-based Alternative Board explainer copy only on the hidden board", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="explainer" />,
    );

    expect(
      screen.getByText(
        "Each team gets group points, plus one stage bonus based on the furthest stage reached.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Stage bonuses are not cumulative.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Teams tab shows every allocated team separately, with its owner, wins, draws, losses, goals for, goals against, goal difference, points, status and next fixture.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Teams are ranked by points first. If teams are level, the board separates them by tournament progress, wins, goal difference, goals scored, goals conceded, then team name.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Badges on this Alternative Board are awarded by team performance and shown as Participant Name (Team Name).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No predictions. No football knowledge needed. Just follow your teams.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /If you have more than one team, their points are added together/,
      ),
    ).not.toBeInTheDocument();
  });

  it("leaves the default shared scoreboard badge behavior unchanged", () => {
    renderAlternativeBoard(
      <SharedScoreboard
        boardData={boardData()}
        defaultTab="badges"
        leadingParticipant={boardData().standings[0]}
      />,
    );

    expect(screen.getByText("Official current leader.")).toBeInTheDocument();
    expect(screen.queryByText("Andy (Japan)")).not.toBeInTheDocument();
  });

  it("leaves the default shared scoreboard explainer copy unchanged", () => {
    renderAlternativeBoard(
      <SharedScoreboard
        boardData={boardData()}
        defaultTab="explainer"
        leadingParticipant={boardData().standings[0]}
      />,
    );

    expect(
      screen.getByText(
        /If you have more than one team, their points are added together/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No predictions. No football knowledge needed. Just follow your teams.",
      ),
    ).not.toBeInTheDocument();
  });

  it("leaves the default shared scoreboard participant sidebar unchanged", () => {
    renderAlternativeBoard(
      <SharedScoreboard
        boardData={boardData()}
        leadingParticipant={boardData().standings[0]}
      />,
    );

    expect(screen.getByText("Choose your name")).toBeInTheDocument();
    expect(screen.getByText("Email optional")).toBeInTheDocument();
    expect(screen.getByTestId("shared-scoreboard-tabs")).not.toHaveClass(
      "sticky",
    );
    expect(
      screen.queryByRole("columnheader", { name: "Change" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^Change [+-]/)).not.toBeInTheDocument();
  });

  it("uses sticky table header offsets on the hidden board", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} initialTab="teams" />,
    );

    expect(screen.getByTestId("teams-column-header")).toHaveClass("top-11");
    expect(screen.getByTestId("teams-row-scroll")).not.toContainElement(
      screen.getByTestId("teams-column-header"),
    );
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
      {
        id: "match-2",
        stage: "Group",
        status: "scheduled",
        homeTeamId: "japan",
        awayTeamId: "scotland",
        homeTeamName: "Japan",
        awayTeamName: "Scotland",
        homeParticipantName: "Andy",
        awayParticipantName: "Jobin",
        participantLabel: "Andy & Jobin",
        homeScore: null,
        awayScore: null,
        kickoffAt: "2026-06-20T20:00:00.000Z",
        kickoffLabel: "20 Jun 2026, 20:00",
        freshness: "cached",
      },
    ],
    badges: [
      {
        id: "first-place",
        label: "1st Place",
        status: "active",
        holderParticipantIds: ["jobin"],
        supportLine: "Official current leader.",
      },
      {
        id: "first-knocked-out",
        label: "First Knocked Out",
        status: "active",
        holderParticipantIds: ["jobin"],
        supportLine: "Official first out.",
      },
    ],
    syncState: {
      lastSuccessfulSyncAt: "2026-06-17T12:00:00.000Z",
      freshnessLabel: "Checked 17 Jun 2026, 12:00 BST",
      freshnessStatus: "current",
      freshnessNotice: "Scores may be delayed by the data provider.",
    },
    summary: {
      leaderName: "Jobin",
      finalMatchCount: 1,
      delayedMatchCount: 0,
      scheduledMatchCount: 1,
      totalGoals: 3,
      activeTeamCount: 3,
      hasFinalMatches: true,
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
