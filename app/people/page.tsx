"use client";

import { useEffect, useState } from "react";
import { PeopleList } from "@/components/PeopleList";
import { PossibleMatchPrompt } from "@/components/PossibleMatchPrompt";
import { groupMeetings } from "@/lib/matching";
import {
  getConfirmations,
  getMeetings,
  resetDemoData,
  setConfirmation,
} from "@/lib/storage";
import type { GroupedMeetings } from "@/lib/types";

function loadGroupedMeetings(): GroupedMeetings {
  return groupMeetings(getMeetings(), getConfirmations());
}

export default function PeoplePage() {
  const [grouped, setGrouped] = useState<GroupedMeetings | null>(null);

  function reload() {
    setGrouped(loadGroupedMeetings());
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
    resetDemoData();
    reload();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
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
            possibleMatches={grouped.possibleMatches}
            onConfirmSamePerson={handleSamePerson}
            onConfirmDifferentPeople={handleDifferentPeople}
          />
          <PeopleList people={grouped.people} />
        </>
      )}
    </main>
  );
}
