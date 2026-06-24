import { expect, test } from "@playwright/test";

test.describe("BL-092 campaign design foundations", () => {
  test("prototype has no horizontal overflow", async ({ page }) => {
    await page.goto("/design/bl-091");

    await expect(
      page.getByRole("heading", { name: "Friday Office Draw" }),
    ).toBeVisible();
    await expect(page.getByText("Matchday bragging rights")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe("BL-093 participant shared board visual rollout", () => {
  test("real shared board route has no horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/s/preview-v7m4q2x9c8p6n3r5t1w0y4k7");

    await expect(
      page.getByRole("heading", { name: "Friday Office Draw" }),
    ).toBeVisible();
    await expect(page.getByText("Leaderboard, teams, badges")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });

  test("explainer tab shows the scoring rules without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/s/preview-v7m4q2x9c8p6n3r5t1w0y4k7");
    await page.getByRole("tab", { name: "Explainer" }).click();

    await expect(
      page.getByRole("heading", { name: "How scoring works" }),
    ).toBeVisible();
    await expect(page.getByText("Reach Round of 16")).toBeVisible();
    await expect(page.getByText("+25 pts")).toBeVisible();
    await expect(
      page.getByText(
        "If you have more than one team, their points are added together. Extra teams are handed out randomly. It's all part of the luck of the draw.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("No predictions. No football knowledge needed."),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe("Alternative board overflow", () => {
  test("preview alternative board tabs have no document horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/s/preview-v7m4q2x9c8p6n3r5t1w0y4k7/alternative-board");

    await expect(
      page.getByRole("heading", { name: "Friday Office Draw" }),
    ).toBeVisible();

    for (const tabName of [
      "Participants",
      "Teams",
      "Badges",
      "Matches",
      "Stats",
      "Explainer",
    ]) {
      await page.getByRole("tab", { name: tabName }).click();

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      );

      expect(hasHorizontalOverflow).toBe(false);
    }
  });

  test("preview alternative board table headers keep a gap below tabs", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Teams and Matches column headers are replaced by mobile cards on small viewports.",
    );

    await page.goto("/s/preview-v7m4q2x9c8p6n3r5t1w0y4k7/alternative-board");

    await expect(
      page.getByRole("heading", { name: "Friday Office Draw" }),
    ).toBeVisible();

    for (const { headerTestId, tabName } of [
      { tabName: "Participants", headerTestId: "participants-column-header" },
      { tabName: "Teams", headerTestId: "teams-column-header" },
      { tabName: "Matches", headerTestId: "matches-column-header" },
    ]) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole("tab", { name: tabName }).click();
      await expect(page.getByTestId(headerTestId)).toBeVisible();

      await page.evaluate(() => window.scrollTo(0, 700));
      await expect(page.getByTestId("shared-scoreboard-tabs")).toBeInViewport();
      await expect(page.getByTestId(headerTestId)).toBeInViewport();

      const stickyGap = await page.evaluate((testId) => {
        const tabs = document.querySelector<HTMLElement>(
          '[data-testid="shared-scoreboard-tabs"]',
        );
        const header = document.querySelector<HTMLElement>(
          `[data-testid="${testId}"]`,
        );

        if (!tabs || !header) {
          throw new Error(`Missing sticky tabs or ${testId}`);
        }

        return Math.abs(
          header.getBoundingClientRect().top -
            tabs.getBoundingClientRect().bottom,
        );
      }, headerTestId);

      expect(stickyGap).toBeGreaterThanOrEqual(11);
      expect(stickyGap).toBeLessThanOrEqual(13);
    }
  });
});
