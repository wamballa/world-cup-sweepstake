"use client";

import { useEffect } from "react";

export function useVisibleBoardRefresh(
  refresh: () => void,
  intervalMs = 60_000,
) {
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [intervalMs, refresh]);
}
