import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type VercelConfig = {
  crons?: Array<{
    path: string;
    schedule: string;
  }>;
};

describe("football-data cron configuration", () => {
  it("runs the protected central sync every 30 minutes", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    ) as VercelConfig;

    expect(config.crons).toEqual([
      {
        path: "/api/cron/football-data-sync",
        schedule: "*/30 * * * *",
      },
    ]);
  });
});
