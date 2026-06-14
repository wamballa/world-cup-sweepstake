import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AiSweepstakeUpdateButton,
  formatAgentFreshness,
} from "./ai-sweepstake-update-button";

describe("AI sweepstake update button", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checks the shared cache again whenever the dialog is reopened", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ready",
            text: "First narrative",
            cached: true,
            generatedAt: "2026-06-15T09:00:00.000Z",
            freshnessLabel: "Checked",
            sourceUpdatedAt: "2026-06-15T08:00:00.000Z",
            model: "test-model",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ready",
            text: "Admin rewritten narrative",
            cached: true,
            generatedAt: "2026-06-15T09:05:00.000Z",
            freshnessLabel: "Checked",
            sourceUpdatedAt: "2026-06-15T08:00:00.000Z",
            model: "test-model",
          }),
        ),
      );

    render(
      <AiSweepstakeUpdateButton
        shareToken="shared-token"
        sourceUpdatedAt="2026-06-15T08:00:00.000Z"
      />,
    );

    fireEvent.click(screen.getByLabelText("Open AI sweepstake update"));
    expect(await screen.findByText("First narrative")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByLabelText("Open AI sweepstake update"));
    expect(await screen.findByText("Admin rewritten narrative")).toBeVisible();

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "/api/ai/sweepstake-update",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("omits the year from Agent freshness dates", () => {
    const label = formatAgentFreshness("2026-06-15T08:00:00.000Z");

    expect(label).toContain("15 Jun");
    expect(label).not.toContain("2026");
  });
});
