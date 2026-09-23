import type { Confirmation, GroupedMeetings, Meeting, PersonGroup } from "./types";

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeEmail(email: string | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export function normalizeLinkedinUrl(linkedinUrl: string | undefined): string {
  if (!linkedinUrl) return "";
  return linkedinUrl.trim().toLowerCase().replace(/\/+$/, "");
}

export function matchMeetings(left: Meeting, right: Meeting): "exact" | "likely" | "possible" | "none" {
  const leftEmail = normalizeEmail(left.email);
  const rightEmail = normalizeEmail(right.email);
  const leftLinkedin = normalizeLinkedinUrl(left.linkedinUrl);
  const rightLinkedin = normalizeLinkedinUrl(right.linkedinUrl);

  if (leftEmail && rightEmail && leftEmail === rightEmail) return "exact";
  if (leftLinkedin && rightLinkedin && leftLinkedin === rightLinkedin) return "exact";
  if (leftEmail && rightEmail && leftEmail !== rightEmail) return "none";
  if (leftLinkedin && rightLinkedin && leftLinkedin !== rightLinkedin) return "none";

  const leftName = normalizeText(left.personName);
  const rightName = normalizeText(right.personName);
  if (!leftName || leftName !== rightName) return "none";

  const sameCompany = normalizeText(left.company) === normalizeText(right.company);
  return sameCompany ? "likely" : "possible";
}

export function groupMeetings(meetings: Meeting[], confirmations: Confirmation[]): GroupedMeetings {
  const parent = meetings.map((_, index) => index);

  function find(index: number): number {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  }

  function union(left: number, right: number) {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  }

  const exactPairs = new Set<string>();

  for (let left = 0; left < meetings.length; left += 1) {
    for (let right = left + 1; right < meetings.length; right += 1) {
      const level = matchMeetings(meetings[left], meetings[right]);
      if (level === "exact" || level === "likely") {
        union(left, right);
        if (level === "exact") exactPairs.add(`${left}:${right}`);
      }
    }
  }

  for (const confirmation of confirmations) {
    if (confirmation.decision !== "same_person") continue;
    const indexes = meetings.flatMap((meeting, index) =>
      normalizeText(meeting.personName) === confirmation.normalizedName ? [index] : [],
    );
    for (let index = 1; index < indexes.length; index += 1) {
      union(indexes[0], indexes[index]);
    }
  }

  const indexesByRoot = new Map<number, number[]>();
  meetings.forEach((_, index) => {
    const root = find(index);
    const list = indexesByRoot.get(root) ?? [];
    list.push(index);
    indexesByRoot.set(root, list);
  });

  const people: PersonGroup[] = [];

  for (const indexes of indexesByRoot.values()) {
    const groupedMeetings = indexes
      .map((index) => meetings[index])
      .sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
    const companies = new Set(groupedMeetings.map((meeting) => normalizeText(meeting.company)));
    const hasExactMatch = indexes.some((left) =>
      indexes.some((right) => left < right && exactPairs.has(`${left}:${right}`)),
    );
    let matchLevel: PersonGroup["matchLevel"] = "single";
    if (groupedMeetings.length > 1) matchLevel = hasExactMatch ? "exact" : "likely";

    people.push({
      key: groupedMeetings.map((meeting) => meeting.id).join("|"),
      meetings: groupedMeetings,
      matchLevel,
      companyChanged: companies.size > 1,
    });
  }

  people.sort((left, right) => left.meetings[0].personName.localeCompare(right.meetings[0].personName));

  const decidedNames = new Set(confirmations.map((confirmation) => confirmation.normalizedName));
  const possibleMatches = [...new Set(meetings.map((meeting) => normalizeText(meeting.personName)).filter(Boolean))]
    .filter((normalizedName) => !decidedNames.has(normalizedName))
    .flatMap((normalizedName) => {
      const groupKeys = people
        .filter((person) =>
          person.meetings.some((meeting) => normalizeText(meeting.personName) === normalizedName),
        )
        .map((person) => person.key);
      return groupKeys.length > 1 ? [{ normalizedName, groupKeys }] : [];
    });

  return { people, possibleMatches };
}
