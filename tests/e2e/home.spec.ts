import { expect, test } from "@playwright/test";

const shareToken = "preview-v7m4q2x9c8p6n3r5t1w0y4k7";
const e2eAdminEmail = process.env.E2E_ADMIN_EMAIL;
const e2eAdminPassword = process.env.E2E_ADMIN_PASSWORD;

test("admin can use dashboard, setup flow, sweepstake tabs, and draw teams", async ({ page }) => {
  test.skip(
    !e2eAdminEmail || !e2eAdminPassword,
    "Hosted Supabase admin credentials are not configured.",
  );
  const adminEmail = e2eAdminEmail ?? "";
  const adminPassword = e2eAdminPassword ?? "";
  const sweepstakeName = `QA Office Draw ${Date.now()}`;

  await page.goto("/admin");

  await expect(page).toHaveURL(/\/login\?next=%2Fadmin|\/login\?next=\/admin/);
  await expect(page.getByText("Admin login")).toBeVisible();
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByRole("textbox", { name: "Password" }).fill(adminPassword);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("heading", { name: "My sweepstakes" })).toBeVisible();
  await expect(page.getByText(adminEmail).first()).toBeVisible();
  await page.getByRole("button", { name: /New sweepstake/ }).first().click();
  await expect(page.getByRole("heading", { name: "Name your sweepstake" })).toBeVisible();
  await page.getByLabel("Sweepstake name").fill(sweepstakeName);
  await page.getByRole("button", { name: "Create sweepstake" }).click();

  await expect(page.getByRole("heading", { name: sweepstakeName })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Participants" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Draw" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();

  await page
    .getByLabel("Bulk participant names")
    .fill("Maya, Alex, Ibrahim");
  await expect(page.getByText("3 pasted names ready.")).toBeVisible();
  await page.getByRole("button", { name: "Add participants" }).click();
  await expect(page.getByText("3 participants added.")).toBeVisible();
  await expect(page.getByLabel("Bulk participant names")).toHaveValue("");
  await expect(page.getByLabel("Participant name for Maya")).toHaveValue("Maya");
  await expect(page.getByLabel("Participant name for Alex")).toHaveValue("Alex");
  await expect(page.getByLabel("Participant name for Ibrahim")).toHaveValue(
    "Ibrahim",
  );

  await page.getByLabel("Bulk participant names").fill("Theo, Theo");
  await expect(page.getByText("Duplicate pasted names: Theo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add participants" })).toBeDisabled();
  await page.getByLabel("Bulk participant names").fill("");

  for (const participantName of ["Theo", "Nia", "Grace", "Sam", "Priya"]) {
    await page.getByLabel("Participant name").fill(participantName);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Participant added.")).toBeVisible();
  }

  await expect(page.getByText("Bulk import")).not.toBeVisible();
  await expect(page.getByText("Add several participants")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save edits" })).not.toBeVisible();
  await expect(page.getByText(/Participants 8\/\d+/)).toBeVisible();
  await expect(page.getByLabel("Participant name for Maya")).toHaveValue("Maya");

  const participantNameInputs = page.locator(
    'input[aria-label^="Participant name for"]',
  );
  await participantNameInputs.nth(0).fill("Maya Updated");
  await participantNameInputs.nth(0).press("Enter");
  await expect(page.getByText("Participant updated.")).toBeVisible();

  await participantNameInputs.nth(1).fill("Maya Updated");
  await participantNameInputs.nth(1).press("Enter");
  await expect(
    page.getByText("Another participant already uses that name."),
  ).toBeVisible();

  await participantNameInputs.nth(1).fill("Alex");
  await page.getByRole("button", { name: "Save" }).nth(1).click();
  await expect(page.getByText("Participant updated.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: sweepstakeName }).first().click();
  await page.getByRole("tab", { name: "Participants" }).click();
  await expect(page.getByLabel("Participant name for Maya Updated")).toHaveValue(
    "Maya Updated",
  );
  await expect(page.getByLabel("Participant name for Alex")).toHaveValue("Alex");

  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByLabel("Sweepstake name")).toHaveValue(/QA Office Draw/);
  await page.getByLabel("Admin emails").fill("ops@example.com");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved to your account.")).toBeVisible();
  await page
    .getByLabel("Tournament")
    .selectOption({ label: "Premier League 2024/25 validation" });
  await expect(page.getByText("Change tournament dataset?")).toBeVisible();
  await expect(
    page.getByText(
      "this sweepstake's team draw, leaderboard scores, badge holders, and cached AI/email outputs",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Change tournament dataset?")).not.toBeVisible();

  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(
    page.getByRole("button", { name: "Randomly allocate teams" }),
  ).toBeVisible();
  await expect(page.getByText("Allocation audit appears after the first draw.")).toBeVisible();

  await page.getByRole("button", { name: "Randomly allocate teams" }).click();

  await expect(
    page.getByText(/\d+ teams allocated across 8 participants\./),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Participants" }).click();
  await page
    .getByLabel("Bulk participant names")
    .fill("Late One, Late Two");
  await page.getByRole("button", { name: "Add participants" }).click();
  await expect(page.getByText("2 participants added.")).toBeVisible();
  await page
    .locator('input[aria-label^="Participant name for"]')
    .nth(7)
    .fill("Priya Updated");
  await page.getByRole("button", { name: "Save" }).nth(7).click();
  await expect(page.getByText("Participant updated.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: sweepstakeName }).first().click();
  await page.getByRole("tab", { name: "Participants" }).click();
  await expect(page.getByLabel("Participant name for Priya Updated")).toHaveValue(
    "Priya Updated",
  );
  await page.getByRole("tab", { name: "Draw" }).click();
  await expect(
    page.getByText(/\d+ teams allocated across 8 participants\./),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Copy link" })).toBeEnabled();
  await expect(page.getByText(/https?:\/\/.+\/s\//)).toBeVisible();
  await expect(page.getByText("Shared scoreboard preview")).not.toBeVisible();
  const shareUrl = await page
    .locator("p.font-mono")
    .filter({ hasText: /https?:\/\/.+\/s\// })
    .first()
    .textContent();

  expect(shareUrl).toMatch(/^https?:\/\/.+\/s\//);
  await page.goto(shareUrl ?? "");
  await expect(page.getByRole("heading", { name: sweepstakeName })).toBeVisible();
  await expect(page.getByText("Shared scoreboard preview")).not.toBeVisible();
  await expect(page.getByText(/fictional|mock|Phase 3/i)).not.toBeVisible();
  await expect(page.getByLabel("Your name")).toContainText("Maya Updated");

  const secondSweepstakeName = `QA Second Draw ${Date.now()}`;

  await page.goto("/admin");
  await page.getByRole("button", { name: /New sweepstake/ }).first().click();
  await page.getByLabel("Sweepstake name").fill(secondSweepstakeName);
  await page.getByRole("button", { name: "Create sweepstake" }).click();
  await expect(page.getByRole("heading", { name: secondSweepstakeName })).toBeVisible();

  for (const participantName of ["Zara", "Omar"]) {
    await page.getByLabel("Participant name").fill(participantName);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Participant added.")).toBeVisible();
  }

  await page.getByRole("tab", { name: "Draw" }).click();
  await page.getByRole("button", { name: "Randomly allocate teams" }).click();
  await expect(
    page.getByText(/\d+ teams allocated across 2 participants\./),
  ).toBeVisible();

  const secondShareUrl = await page
    .locator("p.font-mono")
    .filter({ hasText: /https?:\/\/.+\/s\// })
    .first()
    .textContent();

  await page.goto(secondShareUrl ?? "");
  await expect(page.getByRole("heading", { name: secondSweepstakeName })).toBeVisible();
  await expect(page.getByLabel("Your name")).toContainText("Zara");
  await expect(page.getByLabel("Your name")).not.toContainText("Maya Updated");
  await expect(page.getByText(/fictional|mock|Phase 3/i)).not.toBeVisible();

  await page.goto(shareUrl ?? "");
  await expect(page.getByRole("heading", { name: sweepstakeName })).toBeVisible();
  await expect(page.getByLabel("Your name")).toContainText("Maya Updated");
  await expect(page.getByLabel("Your name")).not.toContainText("Zara");

  await page.goto("/admin");
  await page.getByRole("button", { name: secondSweepstakeName }).first().click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Archive sweepstake" }).click();
  await expect(page.getByText("Archive this sweepstake?")).toBeVisible();
  await page.getByRole("button", { name: "Archive sweepstake" }).last().click();
  await expect(page.getByRole("heading", { name: "My sweepstakes" })).toBeVisible();

  await page.goto("/admin");
  await page.getByRole("button", { name: sweepstakeName }).first().click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Archive sweepstake" }).click();
  await expect(page.getByText("Archive this sweepstake?")).toBeVisible();
  await page.getByRole("button", { name: "Archive sweepstake" }).last().click();
  await expect(page.getByRole("heading", { name: "My sweepstakes" })).toBeVisible();
  await expect(page.getByRole("button", { name: sweepstakeName })).not.toBeVisible();

  await page.getByRole("button", { name: "Log out" }).first().click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin|\/login\?next=\/admin/);

  await page.goto(shareUrl ?? "");
  await expect(page.getByRole("heading", { name: sweepstakeName })).not.toBeVisible();
});

test("participant board is separated from admin controls and supports saved identity", async ({
  page,
}) => {
  await page.goto(`/s/${shareToken}`);
  await page.evaluate((token) => {
    window.localStorage.removeItem(
      `world-cup-sweepstake:selected-participant:${token}`,
    );
  }, shareToken);
  await page.reload();

  await expect(page.getByRole("heading", { name: "Friday Office Draw" })).toBeVisible();
  await expect(page.getByLabel("Sweepstake name")).not.toBeVisible();
  await expect(page.getByLabel("Admin emails")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Randomly allocate teams" }),
  ).not.toBeVisible();
  await expect(page.getByLabel("Move to")).not.toBeVisible();
  await expect(page.getByLabel("Open AI sweepstake update")).toBeVisible();
  await page.getByLabel("Open AI sweepstake update").click();
  await expect(
    page.getByRole("dialog").getByText("Sweepstake pulse check"),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Cached sweepstake data"),
  ).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Building the latest AI update")).not.toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Open AI sweepstake update").click();
  await expect(
    page.getByRole("dialog").getByText("Sweepstake pulse check"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();

  await expect(page.getByLabel("Your sweepstake")).toContainText(
    "Choose your name",
  );
  await page.getByLabel("Your name").selectOption({ label: "Maya" });
  await page.getByRole("button", { name: "Show my sweepstake" }).click();

  await expect(page.getByLabel("Your sweepstake")).toContainText("Maya");
  await expect(page.getByLabel("Your sweepstake")).toContainText("total points");
  await expect(page.getByLabel("Your sweepstake")).toContainText("Allocated teams");
  await expect(page.getByLabel("Your sweepstake")).toContainText("Badges");
  await expect(page.getByLabel("Your sweepstake")).toContainText("Recent match");
  await expect(page.getByLabel("Your sweepstake")).toContainText("Next match");
  await expect(page.getByLabel("Your sweepstake")).toContainText("Email updates on");

  await page.reload();
  await expect(page.getByText("Viewing as")).toBeVisible();
  await expect(page.getByText("Maya").first()).toBeVisible();

  await page.getByRole("button", { name: "Switch" }).click();
  await page.getByLabel("Your name").selectOption({ label: "Theo" });
  await page.getByRole("button", { name: "Show my sweepstake" }).click();
  await expect(page.getByLabel("Your sweepstake")).toContainText("Theo");

  await page.getByRole("tab", { name: "Teams" }).click();
  await expect(page.getByRole("cell", { name: "Aurora Republic" })).toBeVisible();
  await expect(page.getByText("Showing all 48 cached tournament teams")).toBeVisible();

  await page.getByRole("tab", { name: "Badges" }).click();
  await expect(page.getByLabel("Friday Office Draw").getByText("Wooden Spoon")).toBeVisible();
  await expect(
    page.getByLabel("Friday Office Draw").getByText("manual-future"),
  ).not.toBeVisible();

  await page.getByRole("tab", { name: "Matches" }).click();
  await expect(page.getByRole("columnheader", { name: "Participants" })).toBeVisible();
  await expect(
    page.getByLabel("Friday Office Draw").getByText("Delayed").first(),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Stats" }).click();
  await expect(page.getByText("Matches with final cached scores.")).toBeVisible();
  await expect(page.getByText("Scheduled or delayed fixtures still awaiting final cached scores.")).toBeVisible();
});
