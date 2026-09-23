import { describe, expect, it } from "vitest";
import { scoreConference } from "./scoring";
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

describe("scoreConference", () => {
  it("marks a buyer-heavy payments event as Strong", () => {
    const score = scoreConference(conference({}));
    expect(score.points).toBe(70);
    expect(score.tier).toBe("Strong");
    expect(score.reasons).toContain("Payments audience");
    expect(score.reasons).toContain("Buyer-heavy");
  });

  it("marks a mixed travel event as Worth a look", () => {
    const score = scoreConference(
      conference({ vertical: "travel", audienceType: "mixed", audienceSize: 8000 }),
    );
    expect(score.points).toBe(45);
    expect(score.tier).toBe("Worth a look");
  });

  it("marks a vendor-heavy general event as Skip", () => {
    const score = scoreConference(
      conference({ vertical: "general", audienceType: "vendors", audienceSize: 20000 }),
    );
    expect(score.points).toBe(10);
    expect(score.tier).toBe("Skip");
  });

  it("does not change a score because another event is nearby", () => {
    const paymentsEvent = conference({ id: "payments-event" });
    const nearbyEvent = conference({
      id: "nearby-event",
      startDate: "2026-06-08",
      vertical: "general",
      audienceType: "vendors",
      audienceSize: 20000,
    });

    expect(scoreConference(paymentsEvent).points).toBe(70);
    expect(scoreConference(nearbyEvent).points).toBe(10);
  });
});
