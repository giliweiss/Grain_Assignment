import { describe, expect, it } from "vitest";
import { findThinMonths, findTripClusters } from "./clustering";
import type { Conference } from "./types";

function conference(overrides: Partial<Conference>): Conference {
  return {
    id: "example",
    name: "Example",
    startDate: "2026-06-01",
    endDate: "2026-06-03",
    city: "Amsterdam",
    country: "Netherlands",
    region: "Europe",
    vertical: "payments",
    audienceSize: 2000,
    audienceType: "buyers",
    url: "https://example.com",
    ...overrides,
  };
}

describe("findTripClusters", () => {
  it("clusters same-region events that start within 14 days", () => {
    const clusters = findTripClusters([
      conference({ id: "amsterdam", startDate: "2026-06-01" }),
      conference({ id: "london", startDate: "2026-06-10", city: "London" }),
    ]);

    expect(clusters).toEqual([
      { region: "Europe", conferenceIds: ["amsterdam", "london"], dayGap: 9 },
    ]);
  });

  it("does not cluster events more than 14 days apart or in different regions", () => {
    const clusters = findTripClusters([
      conference({ id: "amsterdam", startDate: "2026-06-01" }),
      conference({ id: "berlin", startDate: "2026-06-20", city: "Berlin" }),
      conference({
        id: "vegas",
        startDate: "2026-06-01",
        region: "North America",
        city: "Las Vegas",
      }),
    ]);

    expect(clusters).toEqual([]);
  });

  it("marks every month in the year that has no Strong conference", () => {
    const thinMonths = findThinMonths(
      [conference({ startDate: "2026-06-01" })],
      2026,
    );

    expect(thinMonths).not.toContain(6);
    expect(thinMonths).toHaveLength(11);
  });
});
