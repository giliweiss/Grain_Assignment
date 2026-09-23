import { beforeEach, describe, expect, it } from "vitest";
import { filterConferences } from "./conferences";
import { groupMeetings, matchMeetings } from "./matching";
import {
  addMeeting,
  getConfirmations,
  getMeetings,
  resetDemoData,
  setConfirmation,
} from "./storage";
import type { Meeting } from "./types";

function meeting(overrides: Partial<Meeting>): Meeting {
  return {
    id: "meeting-1",
    conferenceId: "sibos",
    capturedAt: "2026-09-29T12:00:00.000Z",
    personName: "Dana Levi",
    company: "Northwind Payments",
    note: "Asked about coverage",
    interest: "interested",
    ...overrides,
  };
}

function installLocalStorage() {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
  return store;
}

describe("storage guards", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installLocalStorage();
    store.set("grain.seeded", "true");
  });

  it("falls back to seed meetings when stored JSON is corrupt", () => {
    store.set("grain.meetings", "{not json");
    store.set("grain.confirmations", "{not json");

    expect(() => getMeetings()).not.toThrow();
    expect(getMeetings().length).toBeGreaterThan(0);
    expect(getConfirmations()).toEqual([]);
    expect(() => groupMeetings(getMeetings(), getConfirmations())).not.toThrow();
  });

  it("drops broken meeting rows and duplicate ids without crashing", () => {
    store.set(
      "grain.meetings",
      JSON.stringify([
        { id: "only" },
        null,
        "row",
        meeting({ id: "kept" }),
        meeting({ id: "kept", personName: "Other" }),
      ]),
    );

    const meetings = getMeetings();
    expect(meetings.map((item) => item.id)).toEqual(["kept"]);
    expect(() => groupMeetings(meetings, [])).not.toThrow();
  });

  it("keeps an empty meeting list empty", () => {
    store.set("grain.meetings", "[]");
    expect(getMeetings()).toEqual([]);
  });

  it("ignores broken confirmations and keeps a later decision for the same name", () => {
    store.set(
      "grain.confirmations",
      JSON.stringify([
        null,
        { normalizedName: " Alex Rivera ", decision: "same_person" },
        { normalizedName: "alex rivera", decision: "different_people" },
        { normalizedName: "x", decision: "maybe" },
      ]),
    );

    expect(getConfirmations()).toEqual([
      { normalizedName: "alex rivera", decision: "different_people" },
    ]);
  });

  it("persists a saved meeting and restores the seed on reset", () => {
    store.set("grain.meetings", "[]");
    const saved = addMeeting(meeting({ id: "new-person", personName: "New Person" }));
    expect(saved).toBe(true);
    expect(getMeetings().map((item) => item.id)).toEqual(["new-person"]);

    setConfirmation("Alex Rivera", "same_person");
    expect(getConfirmations()).toEqual([
      { normalizedName: "alex rivera", decision: "same_person" },
    ]);

    resetDemoData();
    expect(getConfirmations()).toEqual([]);
    expect(getMeetings().some((item) => item.personName === "Maya Chen")).toBe(true);
    expect(getMeetings().some((item) => item.id === "new-person")).toBe(false);
  });
});

describe("adversarial matching and filters", () => {
  it("does not auto-merge the same name and company when emails conflict", () => {
    const left = meeting({ email: "dana@northwind.com" });
    const right = meeting({
      id: "meeting-2",
      email: "dana@other.com",
      capturedAt: "2026-10-01T12:00:00.000Z",
    });

    expect(matchMeetings(left, right)).toBe("none");
    const grouped = groupMeetings([left, right], []);
    expect(grouped.people).toHaveLength(2);
    expect(grouped.possibleMatches).toEqual([
      { normalizedName: "dana levi", groupKeys: ["meeting-1", "meeting-2"] },
    ]);
  });

  it("treats whitespace-only search as no text filter and combines the other filters", () => {
    const conferences = [
      {
        ...meeting({}),
        id: "sibos",
        name: "Sibos",
        startDate: "2026-09-28",
        endDate: "2026-10-01",
        city: "Miami",
        country: "United States",
        region: "North America" as const,
        vertical: "treasury" as const,
        audienceSize: 10000,
        audienceType: "buyers" as const,
        url: "https://www.sibos.com/",
      },
    ];

    expect(
      filterConferences(conferences, {
        text: "   ",
        vertical: "treasury",
        region: "Europe",
        tier: "all",
      }),
    ).toEqual([]);

    expect(
      filterConferences(conferences, {
        text: "   ",
        vertical: "all",
        region: "all",
        tier: "all",
      }),
    ).toEqual(conferences);
  });
});
