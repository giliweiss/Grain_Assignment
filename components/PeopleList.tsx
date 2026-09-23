"use client";

import { useEffect, useState } from "react";
import { getConferenceById } from "@/lib/conferences";
import { getMeetings, saveMeetings } from "@/lib/storage";
import type { PersonGroup } from "@/lib/types";
import { HubSpotSlot } from "./HubSpotSlot";
import { RelationshipSummarySlot } from "./RelationshipSummarySlot";

type PeopleListProps = {
  people: PersonGroup[];
};

function formatCapturedDate(capturedAt: string): string {
  return new Date(capturedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function matchLevelLabel(matchLevel: PersonGroup["matchLevel"]): string {
  if (matchLevel === "exact") return "Exact match";
  if (matchLevel === "likely") return "Likely match";
  return "Single meeting";
}

function uniqueCompanies(personGroup: PersonGroup): string[] {
  const seen = new Set<string>();
  const companies: string[] = [];
  for (const meeting of personGroup.meetings) {
    const key = meeting.company.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    companies.push(meeting.company);
  }
  return companies;
}

function uniqueEmails(personGroup: PersonGroup): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const meeting of personGroup.meetings) {
    const email = meeting.email?.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return emails;
}

function uniqueLinkedinUrls(personGroup: PersonGroup): string[] {
  const seen = new Set<string>();
  const linkedinUrls: string[] = [];
  for (const meeting of personGroup.meetings) {
    const linkedinUrl = meeting.linkedinUrl?.trim();
    if (!linkedinUrl) continue;
    const key = linkedinUrl.toLowerCase().replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    linkedinUrls.push(linkedinUrl);
  }
  return linkedinUrls;
}

function hasNote(note: string): boolean {
  return note.trim().length > 0;
}

function currentCompany(personGroup: PersonGroup): string {
  const latestMeeting = [...personGroup.meetings].sort((first, second) =>
    first.capturedAt < second.capturedAt ? 1 : -1,
  )[0];
  return latestMeeting?.company ?? "";
}

function companyDiffers(meetingCompany: string, headerCompany: string): boolean {
  return (
    meetingCompany.trim().toLowerCase() !== headerCompany.trim().toLowerCase()
  );
}

function interestBadgeClassName(interest: string): string {
  if (interest === "interested") {
    return "bg-emerald-50 text-emerald-800";
  }
  return "bg-neutral-100 text-neutral-600";
}

export function PeopleList({ people }: PeopleListProps) {
  const [peopleGroups, setPeopleGroups] = useState(people);
  const [addingNoteForMeetingId, setAddingNoteForMeetingId] = useState<
    string | null
  >(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingEmailForGroupKey, setEditingEmailForGroupKey] = useState<
    string | null
  >(null);
  const [emailDraft, setEmailDraft] = useState("");

  useEffect(() => {
    setPeopleGroups(people);
  }, [people]);

  function saveMeetingNote(meetingId: string) {
    const trimmedNote = noteDraft.trim();
    if (!trimmedNote) return;

    const meetings = getMeetings();
    const updatedMeetings = meetings.map((meeting) =>
      meeting.id === meetingId ? { ...meeting, note: trimmedNote } : meeting,
    );
    saveMeetings(updatedMeetings);

    setPeopleGroups((currentGroups) =>
      currentGroups.map((personGroup) => ({
        ...personGroup,
        meetings: personGroup.meetings.map((meeting) =>
          meeting.id === meetingId
            ? { ...meeting, note: trimmedNote }
            : meeting,
        ),
      })),
    );
    setAddingNoteForMeetingId(null);
    setNoteDraft("");
  }

  function savePersonEmail(personGroup: PersonGroup) {
    const trimmedEmail = emailDraft.trim();
    if (!trimmedEmail) return;

    const meetingIds = new Set(
      personGroup.meetings.map((meeting) => meeting.id),
    );
    const meetings = getMeetings();
    const updatedMeetings = meetings.map((meeting) =>
      meetingIds.has(meeting.id)
        ? { ...meeting, email: trimmedEmail }
        : meeting,
    );
    saveMeetings(updatedMeetings);

    setPeopleGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.key === personGroup.key
          ? {
              ...group,
              meetings: group.meetings.map((meeting) => ({
                ...meeting,
                email: trimmedEmail,
              })),
            }
          : group,
      ),
    );
    setEditingEmailForGroupKey(null);
    setEmailDraft("");
  }

  if (peopleGroups.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-600">
        No people yet. Capture a lead on the floor to get started.
      </p>
    );
  }

  return (
    <section className="mt-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Contacts
      </h2>
      <ul className="mt-2 space-y-2">
        {peopleGroups.map((personGroup) => {
          const personName = personGroup.meetings[0]?.personName ?? "Unknown";
          const companies = uniqueCompanies(personGroup);
          const emails = uniqueEmails(personGroup);
          const linkedinUrls = uniqueLinkedinUrls(personGroup);
          const isEditingEmail = editingEmailForGroupKey === personGroup.key;
          const headerCompany = currentCompany(personGroup);
          const meetingCount = personGroup.meetings.length;

          return (
            <li
              key={personGroup.key}
              className="rounded-md border border-neutral-200 bg-white px-3.5 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {personName}
                    </h3>
                    <span className="text-xs text-neutral-400">
                      {meetingCount} {meetingCount === 1 ? "meeting" : "meetings"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-neutral-700">
                    {companies.join(" · ")}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
                    {emails.length > 0 ? (
                      <span>{emails.join(" · ")}</span>
                    ) : null}
                    {isEditingEmail ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="email"
                          value={emailDraft}
                          onChange={(event) => setEmailDraft(event.target.value)}
                          className="min-w-[10rem] rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                          placeholder="Email"
                          aria-label="Email"
                        />
                        <button
                          type="button"
                          onClick={() => savePersonEmail(personGroup)}
                          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800"
                        >
                          Save
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmailForGroupKey(personGroup.key);
                          setEmailDraft(emails[0] ?? "");
                        }}
                        className="text-xs font-medium text-neutral-500 underline underline-offset-2"
                      >
                        {emails.length === 0 ? "Add email" : "Update email"}
                      </button>
                    )}
                  </div>

                  {linkedinUrls.length > 0 ? (
                    <div className="mt-0.5 space-y-0.5">
                      {linkedinUrls.map((linkedinUrl) => (
                        <p
                          key={linkedinUrl}
                          className="truncate text-xs text-neutral-500"
                        >
                          {linkedinUrl}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500">
                  {matchLevelLabel(personGroup.matchLevel)}
                </span>
              </div>

              {personGroup.companyChanged ? (
                <p className="mt-1 text-xs text-amber-700">
                  Company text changed
                </p>
              ) : null}

              <ul className="mt-2.5 space-y-1.5 border-t border-neutral-100 pt-2.5">
                {personGroup.meetings.map((meeting) => {
                  const conference = getConferenceById(meeting.conferenceId);
                  const conferenceName =
                    conference?.name ?? meeting.conferenceId;
                  const meetingHasNote = hasNote(meeting.note);
                  const isAddingNote = addingNoteForMeetingId === meeting.id;
                  const interestLabel =
                    meeting.interest === "interested"
                      ? "Interested"
                      : "Not now";

                  return (
                    <li key={meeting.id} className="text-sm text-neutral-700">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="tabular-nums text-neutral-500">
                          {formatCapturedDate(meeting.capturedAt)}
                        </span>
                        <span className="font-medium text-neutral-800">
                          {conferenceName}
                        </span>
                        {companyDiffers(meeting.company, headerCompany) ? (
                          <span className="text-neutral-500">
                            {meeting.company}
                          </span>
                        ) : null}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${interestBadgeClassName(meeting.interest)}`}
                        >
                          {interestLabel}
                        </span>
                      </div>

                      {meetingHasNote ? (
                        <p className="mt-0.5 text-xs leading-snug text-neutral-600">
                          {meeting.note}
                        </p>
                      ) : isAddingNote ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <input
                            type="text"
                            value={noteDraft}
                            onChange={(event) =>
                              setNoteDraft(event.target.value)
                            }
                            className="min-w-[10rem] flex-1 rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                            placeholder="Note"
                            aria-label="Meeting note"
                          />
                          <button
                            type="button"
                            onClick={() => saveMeetingNote(meeting.id)}
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingNoteForMeetingId(meeting.id);
                            setNoteDraft("");
                          }}
                          className="mt-0.5 text-xs font-medium text-neutral-500 underline underline-offset-2"
                        >
                          Add note
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 space-y-2 border-t border-neutral-100 pt-2.5">
                {personGroup.meetings.length >= 2 ? (
                  <RelationshipSummarySlot
                    personName={personName}
                    meetings={personGroup.meetings}
                  />
                ) : null}
                <HubSpotSlot
                  personName={personName}
                  meetings={personGroup.meetings}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
