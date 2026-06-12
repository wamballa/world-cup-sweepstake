import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVisibleBoardRefresh } from "./use-visible-board-refresh";

describe("visible shared-board refresh", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("refreshes every minute while the page is visible", () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");

    renderHook(() => useVisibleBoardRefresh(refresh));
    act(() => vi.advanceTimersByTime(60_000));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh while the page is hidden", () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");

    renderHook(() => useVisibleBoardRefresh(refresh));
    act(() => vi.advanceTimersByTime(120_000));

    expect(refresh).not.toHaveBeenCalled();
  });
});
