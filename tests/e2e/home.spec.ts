import { expect, test } from "@playwright/test";

test("loads the phase 2 setup page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText("Build the sweepstake, draw the teams, share the board.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Randomly allocate teams" }),
  ).toBeVisible();
});
