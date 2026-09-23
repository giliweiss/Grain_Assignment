"use client";

import { useState } from "react";
import { getConferenceById } from "@/lib/conferences";
import type { Meeting } from "@/lib/types";

type RelationshipSummarySlotProps = {
  personName: string;
  meetings: Meeting[];
};

type SummaryResponse = {
  configured?: boolean;
  error?: string;
  whatChanged?: string;
  nextAction?: string;
};

export function RelationshipSummarySlot({
  personName,
  meetings,
}: RelationshipSummarySlotProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  async function requestSummary() {
    setIsLoading(true);
    setErrorMessage(null);
    setSummary(null);

    try {
      const response = await fetch("/api/relationship-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName,
          meetings: meetings.map((meeting) => {
            const conference = getConferenceById(meeting.conferenceId);
            return {
              conferenceName: conference?.name ?? meeting.conferenceId,
              date: meeting.capturedAt,
              company: meeting.company,
              note: meeting.note,
              interest: meeting.interest,
            };
          }),
        }),
      });

      const data = (await response.json()) as SummaryResponse;
      if (!response.ok || data.error) {
        setErrorMessage(
          data.error ?? "Could not generate a relationship summary.",
        );
        return;
      }

      setSummary(data);
    } catch {
      setErrorMessage("Could not generate a relationship summary.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-w-0 max-w-full">
      <button
        type="button"
        onClick={requestSummary}
        disabled={isLoading}
        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {isLoading ? "Generating…" : "Relationship summary"}
      </button>

      {errorMessage ? (
        <p className="mt-1.5 text-xs text-red-700">{errorMessage}</p>
      ) : null}

      {summary && !summary.configured ? (
        <p className="mt-1.5 text-xs text-neutral-600">
          OpenAI is not configured. Set OPENAI_API_KEY in .env.local or Vercel.
        </p>
      ) : null}

      {summary &&
      summary.configured &&
      summary.whatChanged &&
      summary.nextAction ? (
        <div className="mt-2 max-w-md space-y-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs leading-snug text-neutral-700">
          <p>
            <span className="font-medium text-neutral-800">Changed:</span>{" "}
            {summary.whatChanged}
          </p>
          <p>
            <span className="font-medium text-neutral-800">Next:</span>{" "}
            {summary.nextAction}
          </p>
        </div>
      ) : null}
    </div>
  );
}
