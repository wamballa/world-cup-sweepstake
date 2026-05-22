import { describe, expect, it } from "vitest";

import { shouldSkipFootballDataSync } from "./sync";

describe("football-data sync rate guard", () => {
  it("skips sync runs that start less than one minute after the previous run", () => {
    expect(
      shouldSkipFootballDataSync(
        "2026-05-20T13:00:30.000Z",
        new Date("2026-05-20T13:01:00.000Z"),
      ),
    ).toBe(true);
  });

  it("allows sync runs once the one minute football-data.org cooldown has passed", () => {
    expect(
      shouldSkipFootballDataSync(
        "2026-05-20T13:00:00.000Z",
        new Date("2026-05-20T13:01:00.000Z"),
      ),
    ).toBe(false);
  });
});
