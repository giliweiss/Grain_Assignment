"use client";

import { useState } from "react";
import { getConferenceById } from "@/lib/conferences";
import type { Meeting } from "@/lib/types";

type HubSpotSlotProps = {
  personName: string;
  meetings: Meeting[];
};

type HubSpotPayload = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  conferenceName: string;
  note: string;
};

type HubSpotResponse = {
  sent: boolean;
  reason?: string;
  payload: HubSpotPayload;
};

function splitPersonName(personName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmedName = personName.trim();
  const spaceIndex = trimmedName.indexOf(" ");
  if (spaceIndex === -1) {
    return { firstName: trimmedName, lastName: "" };
  }
  return {
    firstName: trimmedName.slice(0, spaceIndex),
    lastName: trimmedName.slice(spaceIndex + 1).trim(),
  };
}

function meetingsNewestFirst(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((left, right) =>
    right.capturedAt.localeCompare(left.capturedAt),
  );
}

function getEmailFromMeetings(meetings: Meeting[]): string {
  for (const meeting of meetingsNewestFirst(meetings)) {
    const email = meeting.email?.trim();
    if (email) return email;
  }
  return "";
}

export function HubSpotSlot({ personName, meetings }: HubSpotSlotProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<HubSpotResponse | null>(null);

  async function sendToHubSpot() {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    const latestMeeting = meetingsNewestFirst(meetings)[0];
    const conference = getConferenceById(latestMeeting.conferenceId);
    const { firstName, lastName } = splitPersonName(personName);

    const requestBody = {
      email: getEmailFromMeetings(meetings),
      firstName,
      lastName,
      company: latestMeeting.company,
      conferenceName: conference?.name ?? latestMeeting.conferenceId,
      note: latestMeeting.note,
    };

    try {
      const response = await fetch("/api/hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        setErrorMessage("Could not send to HubSpot.");
        return;
      }

      const data = (await response.json()) as HubSpotResponse;
      setResult(data);
    } catch {
      setErrorMessage("Could not send to HubSpot.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="contents">
      <button
        type="button"
        onClick={sendToHubSpot}
        disabled={isLoading}
        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium text-neutral-900 hover:border-neutral-400 disabled:opacity-60"
      >
        {isLoading ? "Sending…" : "Send to HubSpot"}
      </button>

      {errorMessage ? (
        <p className="basis-full text-xs text-red-700">{errorMessage}</p>
      ) : null}

      {result?.sent ? (
        <p className="basis-full text-xs text-green-800">
          Contact created in HubSpot. The meeting note and conference history
          stay in this app.
        </p>
      ) : null}

      {result && !result.sent ? (
        <div className="basis-full max-w-md space-y-1 text-xs text-neutral-700">
          <p>
            <span className="font-medium text-neutral-800">Not sent:</span>{" "}
            {result.reason}
          </p>
          <pre className="overflow-x-auto rounded bg-neutral-50 p-1.5 font-mono text-[11px] leading-snug text-neutral-600">
            {JSON.stringify(result.payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
