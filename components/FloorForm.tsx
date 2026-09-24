"use client";

import { useRef, useState, type FormEvent } from "react";
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
  const [formError, setFormError] = useState("");
  const saveLocked = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveLocked.current) return;

    const trimmedName = personName.trim();
    const trimmedCompany = company.trim();
    const trimmedNote = note.trim();
    const trimmedEmail = email.trim();
    const trimmedLinkedinUrl = linkedinUrl.trim();

    if (!conferenceId || !trimmedName || !trimmedCompany) {
      setSavedMessage("");
      setFormError("Enter a name, company, and conference.");
      return;
    }

    saveLocked.current = true;

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

    const saved = addMeeting(meeting);
    if (!saved) {
      saveLocked.current = false;
      setSavedMessage("");
      setFormError("Could not save this meeting.");
      return;
    }

    setPersonName("");
    setCompany("");
    setEmail("");
    setLinkedinUrl("");
    setNote("");
    setInterest("interested");
    setFormError("");
    setSavedMessage(`Saved ${trimmedName}. Ready for the next person.`);
    nameInput.current?.focus();
    window.setTimeout(() => {
      saveLocked.current = false;
    }, 400);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 pb-20 sm:pb-0">
      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
        <span>
          Conference <span className="font-normal text-neutral-600">Required</span>
        </span>
        <select
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          <span>
            Name <span className="font-normal text-neutral-600">Required</span>
          </span>
          <input
            ref={nameInput}
            type="text"
            autoComplete="name"
            maxLength={120}
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          <span>
            Company <span className="font-normal text-neutral-600">Required</span>
          </span>
          <input
            type="text"
            autoComplete="organization"
            maxLength={160}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>

      <details className="rounded-xl border border-neutral-200 bg-white p-3">
        <summary className="text-sm font-medium text-neutral-900">
          Add contact details or a note (optional)
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            You can add missing details later from People.
          </p>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            <span>
              Email <span className="font-normal text-neutral-600">Optional</span>
            </span>
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            <span>
              LinkedIn <span className="font-normal text-neutral-600">Optional</span>
            </span>
            <input
              type="text"
              inputMode="url"
              maxLength={300}
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            <span>
              Note <span className="font-normal text-neutral-600">Optional</span>
            </span>
            <textarea
              rows={2}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={fieldClassName}
            />
          </label>
        </div>
      </details>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-neutral-500">Interest</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-base text-neutral-900">
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
          <label className="flex items-center gap-2 text-base text-neutral-900">
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

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-[#f7f7f5] px-4 py-3 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white hover:bg-neutral-700"
        >
          Save lead
        </button>
      </div>

      {formError ? (
        <p className="text-center text-sm font-medium text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

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
