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
});
