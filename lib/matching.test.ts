import { describe, expect, it } from "vitest";
import { groupMeetings, matchMeetings } from "./matching";
import type { Meeting } from "./types";

function meeting(overrides: Partial<Meeting>): Meeting {
  return {
    id: "meeting-1",
    conferenceId: "sibos",
    capturedAt: "2026-09-01T10:00:00.000Z",
    personName: "Dana Levi",
    company: "Northwind Payments",
    note: "Asked about coverage",
    interest: "interested",
    ...overrides,
  };
}

describe("matchMeetings", () => {
  it("matches the same email exactly, including case and surrounding spaces", () => {
    const result = matchMeetings(
      meeting({ email: " Dana@Northwind.com " }),
      meeting({ id: "meeting-2", email: "dana@northwind.com", company: "Other Co" }),
    );
    expect(result).toBe("exact");
  });

  it("matches the same LinkedIn URL exactly when only the trailing slash differs", () => {
    const result = matchMeetings(
      meeting({ linkedinUrl: "https://www.linkedin.com/in/DanaLevi/" }),
      meeting({ id: "meeting-2", linkedinUrl: "https://www.linkedin.com/in/danalevi" }),
    );
    expect(result).toBe("exact");
  });

  it("treats the same normalized name and company as a likely match", () => {
    const result = matchMeetings(
      meeting({ personName: " Dana   Levi " }),
      meeting({ id: "meeting-2", personName: "dana levi", company: " northwind payments " }),
    );
    expect(result).toBe("likely");
  });

  it("treats the same name at a different company as a possible match", () => {
    const result = matchMeetings(
      meeting({}),
      meeting({ id: "meeting-2", company: "Harbor Treasury" }),
    );
    expect(result).toBe("possible");
  });
});

describe("groupMeetings", () => {
  it("groups an exact email match and flags a company change", () => {
    const grouped = groupMeetings(
      [
        meeting({ id: "first", email: "dana@northwind.com", company: "Northwind Payments" }),
        meeting({
          id: "second",
          email: "dana@northwind.com",
          company: "Harbor Treasury",
          capturedAt: "2026-10-01T10:00:00.000Z",
        }),
      ],
      [],
    );

    expect(grouped.people).toHaveLength(1);
    expect(grouped.people[0].matchLevel).toBe("exact");
    expect(grouped.people[0].companyChanged).toBe(true);
    expect(grouped.possibleMatches).toEqual([]);
  });

  it("keeps a possible match separate until the rep confirms", () => {
    const meetings = [
      meeting({ id: "first", company: "Northwind Payments" }),
      meeting({ id: "second", company: "Harbor Treasury" }),
    ];

    const waiting = groupMeetings(meetings, []);
    expect(waiting.people).toHaveLength(2);
    expect(waiting.possibleMatches).toEqual([
      { normalizedName: "dana levi", groupKeys: ["first", "second"] },
    ]);

    const samePerson = groupMeetings(meetings, [
      { normalizedName: "dana levi", decision: "same_person" },
    ]);
    expect(samePerson.people).toHaveLength(1);
    expect(samePerson.possibleMatches).toEqual([]);

    const differentPeople = groupMeetings(meetings, [
      { normalizedName: "dana levi", decision: "different_people" },
    ]);
    expect(differentPeople.people).toHaveLength(2);
    expect(differentPeople.possibleMatches).toEqual([]);
  });
});
