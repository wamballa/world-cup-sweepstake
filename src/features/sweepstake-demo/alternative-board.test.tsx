import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

import { AlternativeBoard, getFirstName } from "./alternative-board";
import { SharedScoreboard } from "./shared-scoreboard";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
});

beforeEach(() => {
  window.localStorage.clear();
  mockKeepyUppyFetch({
    highScore: 11,
    scores: [
      {
        id: "score-1",
        playerName: "Maya",
        score: 11,
        createdAt: "2026-06-22T10:00:00.000Z",
      },
    ],
  });
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
    expect(screen.getByText("Today's matches")).toBeInTheDocument();
    expect(screen.queryByText(/Cached tournament data/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Scores may be delayed by the data provider."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Checked 17 Jun 2026, 12:00 BST"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Updates")).not.toBeInTheDocument();
    expect(screen.queryByText("Views")).not.toBeInTheDocument();
    expect(screen.queryByText("6 tabs")).not.toBeInTheDocument();
  });

  it("shows today's UK-date matches in the Alternative Board hero", () => {
    const data = boardData();
    const todayIso = new Date().toISOString();

    data.matches = [
      {
        ...data.matches[0],
        kickoffAt: todayIso,
        kickoffLabel: "Today, 12:00",
        status: "scheduled",
      },
      {
        ...data.matches[1],
        kickoffAt: new Date(Date.now() + 86_400_000).toISOString(),
        kickoffLabel: "Tomorrow, 20:00",
        status: "scheduled",
      },
    ];

    renderAlternativeBoard(<AlternativeBoard boardData={data} />);

    const heroToday = screen.getByLabelText("Today's matches");

    expect(within(heroToday).getByText("Japan v Norway")).toBeInTheDocument();
    expect(within(heroToday).getByText("Andy & Jobin")).toBeInTheDocument();
    expect(within(heroToday).getByText("Today, 12:00")).toBeInTheDocument();
    expect(
      within(heroToday).queryByText("Japan v Scotland"),
    ).not.toBeInTheDocument();
  });

  it("shows up to six hero matches before pointing to the full Matches tab", () => {
    const data = boardData();
    const todayIso = new Date().toISOString();

    data.matches = Array.from({ length: 7 }, (_, index) => ({
      ...data.matches[0],
      id: `today-match-${index + 1}`,
      homeTeamName: `Home ${index + 1}`,
      awayTeamName: `Away ${index + 1}`,
      kickoffAt: todayIso,
      kickoffLabel: `Today, ${String(12 + index).padStart(2, "0")}:00`,
      status: "scheduled",
    }));

    renderAlternativeBoard(<AlternativeBoard boardData={data} />);

    const heroToday = screen.getByLabelText("Today's matches");

    expect(within(heroToday).getByText("Home 1 v Away 1")).toBeInTheDocument();
    expect(within(heroToday).getByText("Home 6 v Away 6")).toBeInTheDocument();
    expect(
      within(heroToday).queryByText("Home 7 v Away 7"),
    ).not.toBeInTheDocument();
    expect(within(heroToday).getByText("+1 more in Matches")).toHaveClass(
      "rounded-full",
      "bg-white",
    );
  });

  it("shows completed match scores in the Alternative Board hero", () => {
    const data = boardData();

    data.matches = [
      {
        ...data.matches[0],
        kickoffAt: new Date().toISOString(),
        kickoffLabel: "Today, 12:00",
        status: "final",
        homeScore: 2,
        awayScore: 1,
      },
    ];

    renderAlternativeBoard(<AlternativeBoard boardData={data} />);

    const heroToday = screen.getByLabelText("Today's matches");

    expect(within(heroToday).getByText("Japan v Norway")).toBeInTheDocument();
    expect(within(heroToday).getByText("2-1")).toHaveClass(
      "bg-white",
      "text-campaign-purple-strong",
    );
    expect(within(heroToday).queryByText("final")).not.toBeInTheDocument();
  });

  it("falls back to the next upcoming match when the Alternative Board has no matches today", () => {
    const data = boardData();

    data.matches = [
      {
        ...data.matches[0],
        kickoffAt: new Date(Date.now() - 86_400_000).toISOString(),
        kickoffLabel: "Yesterday, 12:00",
        status: "final",
      },
      {
        ...data.matches[1],
        kickoffAt: new Date(Date.now() + 86_400_000).toISOString(),
        kickoffLabel: "Tomorrow, 20:00",
        status: "scheduled",
      },
    ];

    renderAlternativeBoard(<AlternativeBoard boardData={data} />);

    const heroToday = screen.getByLabelText("Today's matches");

    expect(within(heroToday).getByText("Japan v Scotland")).toBeInTheDocument();
    expect(within(heroToday).getByText("Tomorrow, 20:00")).toBeInTheDocument();
    expect(within(heroToday).queryByText("Japan v Norway")).not.toBeInTheDocument();
  });

  it("shows the AI update button when a share token is provided", () => {
    renderAlternativeBoard(
      <AlternativeBoard boardData={boardData()} shareToken="real-token" />,
    );

    expect(
      screen.getByLabelText("Open AI sweepstake update"),
    ).toBeInTheDocument();
  });

  it("does not show the AI update button without a share token", () => {
    renderAlternativeBoard(<AlternativeBoard boardData={boardData()} />);

    expect(
      screen.queryByLabelText("Open AI sweepstake update"),
    ).not.toBeInTheDocument();
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

  it("shows the keepy-uppy accessory with the hidden board leader first name", () => {
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        keepyUppyScoreboard={{
          highScore: 9,
          scores: [
            {
              id: "score-1",
              playerName: "Ava",
              score: 9,
              createdAt: "2026-06-22T10:00:00.000Z",
            },
          ],
        }}
      />,
    );

    const keepyUppy = screen.getByTestId("leader-keepy-uppy");
    const keepyUppyFrame = screen.getByTestId("keepy-uppy-frame");

    expect(keepyUppy).toBeInTheDocument();
    expect(keepyUppyFrame).toHaveClass(
      "bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_34%,rgba(77,20,125,0.36)_72%,rgba(239,0,86,0.32))]",
    );
    expect(keepyUppyFrame).toHaveClass("lg:h-[19.75rem]");
    expect(keepyUppyFrame).not.toHaveClass("bg-white/15");
    expect(keepyUppyFrame.querySelector("canvas")).toBeNull();
    expect(
      screen.getByLabelText("Andy's keepy-uppy challenge"),
    ).toBeInTheDocument();
    expect(within(keepyUppy).getByText("Keepy Uppy")).toBeInTheDocument();
    expect(within(keepyUppy).getByText("Challenge")).toBeInTheDocument();
    expect(within(keepyUppy).queryByText("Andy")).not.toBeInTheDocument();
    expect(within(keepyUppy).getByText("Keep-ups 0")).toBeInTheDocument();
    expect(
      within(keepyUppy).getByRole("button", { name: "Hi Score 9" }),
    ).toBeInTheDocument();
    expect(
      within(keepyUppyFrame).getByRole("button", { name: "Hi Score 9" }),
    ).toBeInTheDocument();
  });

  it("opens the keepy-uppy high-score dialog from the hero pill", async () => {
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        keepyUppyScoreboard={{
          highScore: 9,
          scores: [
            {
              id: "score-1",
              playerName: "Ava",
              score: 9,
              createdAt: "2026-06-22T10:00:00.000Z",
            },
          ],
        }}
        shareToken="real-token"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hi Score 9" }));

    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "Keepy-uppy high scores" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("asks for a player name when a completed streak beats the high score", async () => {
    mockKeepyUppyFetch({
      highScore: 0,
      scores: [],
    });
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        keepyUppyScoreboard={{
          highScore: 0,
          scores: [],
        }}
        shareToken="real-token"
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Keep Andy's ball up" }),
      {
        clientX: 224,
        clientY: 142,
      },
    );

    await waitFor(
      () =>
        expect(
          screen.getByRole("dialog", { name: "New high score" }),
        ).toBeInTheDocument(),
      { timeout: 1500 },
    );
    expect(screen.getByLabelText("Player name")).toBeInTheDocument();
  });

  it("asks for a player name when a completed streak makes the top 10", async () => {
    mockKeepyUppyFetch({
      highScore: 6,
      scores: [
        {
          id: "score-1",
          playerName: "Ava",
          score: 6,
          createdAt: "2026-06-22T10:00:00.000Z",
        },
      ],
    });
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        keepyUppyScoreboard={{
          highScore: 6,
          scores: [
            {
              id: "score-1",
              playerName: "Ava",
              score: 6,
              createdAt: "2026-06-22T10:00:00.000Z",
            },
          ],
        }}
        shareToken="real-token"
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Keep Andy's ball up" }),
      {
        clientX: 224,
        clientY: 142,
      },
    );

    await waitFor(
      () =>
        expect(
          screen.getByRole("dialog", { name: "You made the top 10" }),
        ).toBeInTheDocument(),
      { timeout: 1500 },
    );
    expect(screen.getByLabelText("Player name")).toBeInTheDocument();
  });

  it("shows the top 10 when a completed streak misses the table", async () => {
    mockKeepyUppyFetch(fullKeepyUppyScoreboard());
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        keepyUppyScoreboard={fullKeepyUppyScoreboard()}
        shareToken="real-token"
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Keep Andy's ball up" }),
      {
        clientX: 224,
        clientY: 142,
      },
    );

    await waitFor(
      () =>
        expect(
          screen.getByRole("dialog", { name: "Sorry, you didn't make it" }),
        ).toBeInTheDocument(),
      { timeout: 1500 },
    );
    const missDialog = screen.getByRole("dialog", {
      name: "Sorry, you didn't make it",
    });

    expect(within(missDialog).getByText("Player 10")).toBeInTheDocument();
    expect(within(missDialog).getByText("2")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "New high score" }),
    ).not.toBeInTheDocument();
  });

  it("does not show a keepy-uppy modal for a zero streak", async () => {
    mockKeepyUppyFetch(fullKeepyUppyScoreboard());
    renderAlternativeBoard(
      <AlternativeBoard
        boardData={boardData()}
        keepyUppyScoreboard={fullKeepyUppyScoreboard()}
        shareToken="real-token"
      />,
    );

    await waitFor(
      () => {
        expect(
          screen.queryByRole("dialog", { name: "Sorry, you didn't make it" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("dialog", { name: "New high score" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("dialog", { name: "You made the top 10" }),
        ).not.toBeInTheDocument();
      },
      { timeout: 800 },
    );
  });

  it("hides the keepy-uppy accessory when no leader first name is available", () => {
    const data = boardData();

    data.teams = data.teams.map((team) =>
      team.id === "japan" ? { ...team, allocatedToName: "   " } : team,
    );

    renderAlternativeBoard(<AlternativeBoard boardData={data} />);

    expect(screen.queryByTestId("leader-keepy-uppy")).not.toBeInTheDocument();
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
    expect(screen.getByText("group points + 10 pts")).toBeInTheDocument();
    expect(screen.getByText("group points + 16 pts")).toBeInTheDocument();
    expect(screen.getByText("group points + 24 pts")).toBeInTheDocument();
    expect(screen.getByText("group points + 30 pts")).toBeInTheDocument();
    expect(screen.getByText("group points + 100 pts")).toBeInTheDocument();
    expect(screen.queryByText("group points + 25 pts")).not.toBeInTheDocument();
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
        "The Participants tab shows everyone's current sweepstake position and allocated teams.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Badges on this board are awarded by team performance and shown as Participant Name (Team Name).",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Alternative Board/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Luck of the Draw/)).not.toBeInTheDocument();
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
    expect(screen.getByText(/Cached tournament data/)).toBeInTheDocument();
    expect(
      screen.getByText("Scores may be delayed by the data provider."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Andy (Japan)")).not.toBeInTheDocument();
    expect(screen.queryByTestId("leader-keepy-uppy")).not.toBeInTheDocument();
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

describe("getFirstName", () => {
  it("trims and returns the first token from a display name", () => {
    expect(getFirstName("  Andy Murray  ")).toBe("Andy");
  });

  it("returns null for empty or placeholder names", () => {
    expect(getFirstName("   ")).toBeNull();
    expect(getFirstName("Unallocated")).toBeNull();
    expect(getFirstName(null)).toBeNull();
  });
});

function renderAlternativeBoard(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

function mockKeepyUppyFetch(scoreboard: {
  highScore: number;
  scores: Array<{
    id: string;
    playerName: string;
    score: number;
    createdAt: string;
  }>;
}) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(scoreboard)));
}

function fullKeepyUppyScoreboard() {
  return {
    highScore: 11,
    scores: Array.from({ length: 10 }, (_, index) => ({
      id: `score-${index + 1}`,
      playerName: `Player ${index + 1}`,
      score: index === 9 ? 2 : 11 - index,
      createdAt: `2026-06-22T10:${String(index).padStart(2, "0")}:00.000Z`,
    })),
  };
}

function boardData(): SharedBoardData {
  return {
    sweepstakeId: "sweepstake-1",
    sweepstakeName: "Engineering",
    tournamentCode: "WC_2026",
    sharedViewMode: "participant_board",
    boardVariant: "official",
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
