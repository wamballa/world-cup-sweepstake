import { describe, expect, it } from "vitest";

import { buildFlagStoragePath } from "./flag-assets";

describe("football-data flag asset helpers", () => {
  it("builds stable storage paths for copied team flags", () => {
    expect(
      buildFlagStoragePath({
        extension: "svg",
        tournamentCode: "WC_2026",
        team: {
          id: "team-row-id",
          external_id: "762",
          name: "Cote d'Ivoire",
        },
      }),
    ).toBe("WC_2026/762-cote-d-ivoire.svg");
  });
});
