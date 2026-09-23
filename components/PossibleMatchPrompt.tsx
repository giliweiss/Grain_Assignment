"use client";

import type { PossibleMatch } from "@/lib/types";

type PossibleMatchPromptProps = {
  possibleMatches: PossibleMatch[];
  onConfirmSamePerson: (normalizedName: string) => void;
  onConfirmDifferentPeople: (normalizedName: string) => void;
};

export function PossibleMatchPrompt({
  possibleMatches,
  onConfirmSamePerson,
  onConfirmDifferentPeople,
}: PossibleMatchPromptProps) {
  if (possibleMatches.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 space-y-2">
      <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Possible matches
      </h2>
      <ul className="space-y-2">
        {possibleMatches.map((possibleMatch) => (
          <li
            key={possibleMatch.normalizedName}
            className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold capitalize text-neutral-900">
                  {possibleMatch.normalizedName}
                </p>
                <p className="text-xs text-neutral-600">
                  {possibleMatch.groupKeys.length} groups · same name, different
                  company
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onConfirmSamePerson(possibleMatch.normalizedName)
                  }
                  className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-sm font-medium text-white"
                >
                  Same person
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onConfirmDifferentPeople(possibleMatch.normalizedName)
                  }
                  className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium text-neutral-900"
                >
                  Different people
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
