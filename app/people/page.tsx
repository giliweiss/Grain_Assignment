"use client";

import { useEffect, useState } from "react";
import { PeopleList } from "@/components/PeopleList";
import {
  PossibleMatchPrompt,
  type PossibleMatchView,
} from "@/components/PossibleMatchPrompt";
import { getConferenceById } from "@/lib/conferences";
import { groupMeetings } from "@/lib/matching";
import {
  getConfirmations,
  getMeetings,
  resetDemoData,
  setConfirmation,
} from "@/lib/storage";
import type { GroupedMeetings, PersonGroup } from "@/lib/types";

function loadGroupedMeetings(): GroupedMeetings {
  try {
    return groupMeetings(getMeetings(), getConfirmations());
  } catch {
    return { people: [], possibleMatches: [] };
  }
}

function confirmedSamePersonNames(): string[] {
  return getConfirmations()
    .filter((confirmation) => confirmation.decision === "same_person")
    .map((confirmation) => confirmation.normalizedName);
}

function possibleMatchViews(grouped: GroupedMeetings): PossibleMatchView[] {
  return grouped.possibleMatches.map((possibleMatch) => ({
    ...possibleMatch,
    groups: possibleMatch.groupKeys.flatMap((groupKey) => {
      const personGroup = grouped.people.find(
        (person) => person.key === groupKey,
      );
      return personGroup ? [describePersonGroup(personGroup)] : [];
    }),
  }));
}

function describePersonGroup(personGroup: PersonGroup) {
  const companies = [
    ...new Set(personGroup.meetings.map((meeting) => meeting.company)),
  ];
  const conferenceNames = [
    ...new Set(
      personGroup.meetings.map(
        (meeting) =>
          getConferenceById(meeting.conferenceId)?.name ?? meeting.conferenceId,
      ),
    ),
  ];
  return { key: personGroup.key, companies, conferenceNames };
}

export default function PeoplePage() {
  const [grouped, setGrouped] = useState<GroupedMeetings | null>(null);
  const [confirmedNames, setConfirmedNames] = useState<string[]>([]);

  function reload() {
    try {
      setGrouped(loadGroupedMeetings());
      setConfirmedNames(confirmedSamePersonNames());
    } catch {
      setGrouped({ people: [], possibleMatches: [] });
      setConfirmedNames([]);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function handleSamePerson(normalizedName: string) {
    setConfirmation(normalizedName, "same_person");
    reload();
  }

  function handleDifferentPeople(normalizedName: string) {
    setConfirmation(normalizedName, "different_people");
    reload();
  }

  function handleResetDemoData() {
    const confirmed = window.confirm(
      "Reset saved contacts and matches to the demo data?",
    );
    if (!confirmed) return;
    resetDemoData();
    reload();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">People</h1>
        <button
          type="button"
          onClick={handleResetDemoData}
          className="text-xs font-medium text-neutral-500 underline underline-offset-2"
        >
          Reset demo data
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Repeat contacts and meeting history across conferences.
      </p>

      {grouped === null ? (
        <p className="mt-5 text-sm text-neutral-600">Loading people…</p>
      ) : (
        <>
          <PossibleMatchPrompt
            possibleMatches={possibleMatchViews(grouped)}
            onConfirmSamePerson={handleSamePerson}
            onConfirmDifferentPeople={handleDifferentPeople}
          />
          <PeopleList
            people={grouped.people}
            confirmedNames={confirmedNames}
          />
        </>
      )}
    </main>
  );
}
