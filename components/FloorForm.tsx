"use client";

import { useState, type FormEvent } from "react";
import { getConferences } from "@/lib/conferences";
import { addMeeting } from "@/lib/storage";
import type { Interest, Meeting } from "@/lib/types";

type FloorFormProps = {
  initialConferenceId: string;
};

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createMeetingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `meeting-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

const fieldClassName =
  "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900";

export function FloorForm({ initialConferenceId }: FloorFormProps) {
  const conferences = getConferences();

  const [conferenceId, setConferenceId] = useState(initialConferenceId);
  const [personName, setPersonName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [note, setNote] = useState("");
  const [interest, setInterest] = useState<Interest>("interested");
  const [savedMessage, setSavedMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = personName.trim();
    const trimmedCompany = company.trim();
    const trimmedNote = note.trim();
    const trimmedEmail = email.trim();
    const trimmedLinkedinUrl = linkedinUrl.trim();

    if (!conferenceId || !trimmedName || !trimmedCompany) {
      return;
    }

    const meeting: Meeting = {
      id: createMeetingId(),
      conferenceId,
      capturedAt: todayDateString(),
      personName: trimmedName,
      company: trimmedCompany,
      note: trimmedNote,
      interest,
    };

    if (trimmedEmail) {
      meeting.email = trimmedEmail;
    }
    if (trimmedLinkedinUrl) {
      meeting.linkedinUrl = trimmedLinkedinUrl;
    }

    addMeeting(meeting);

    setPersonName("");
    setCompany("");
    setEmail("");
    setLinkedinUrl("");
    setNote("");
    setInterest("interested");
    setSavedMessage("Saved. Ready for the next person.");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Conference
        <select
          required
          value={conferenceId}
          onChange={(event) => setConferenceId(event.target.value)}
          className={fieldClassName}
        >
          <option value="" disabled>
            Select a conference
          </option>
          {conferences.map((conference) => (
            <option key={conference.id} value={conference.id}>
              {conference.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Name
        <input
          required
          type="text"
          autoComplete="name"
          value={personName}
          onChange={(event) => setPersonName(event.target.value)}
          className={fieldClassName}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Company
        <input
          required
          type="text"
          autoComplete="organization"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className={fieldClassName}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClassName}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        LinkedIn
        <input
          type="text"
          inputMode="url"
          value={linkedinUrl}
          onChange={(event) => setLinkedinUrl(event.target.value)}
          className={fieldClassName}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Note
        <textarea
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={fieldClassName}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-neutral-700">Interest</legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 text-base text-neutral-900">
            <input
              type="radio"
              name="interest"
              value="interested"
              checked={interest === "interested"}
              onChange={() => setInterest("interested")}
              className="size-5"
            />
            Interested
          </label>
          <label className="flex items-center gap-3 text-base text-neutral-900">
            <input
              type="radio"
              name="interest"
              value="not_now"
              checked={interest === "not_now"}
              onChange={() => setInterest("not_now")}
              className="size-5"
            />
            Not now
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        className="mt-1 w-full rounded-md bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white"
      >
        Save meeting
      </button>

      {savedMessage ? (
        <p
          className="text-center text-sm font-medium text-emerald-800"
          role="status"
        >
          {savedMessage}
        </p>
      ) : null}
    </form>
  );
}
