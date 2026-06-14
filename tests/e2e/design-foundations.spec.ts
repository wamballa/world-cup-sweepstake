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
