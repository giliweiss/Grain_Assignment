"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getConferenceById } from "@/lib/conferences";
import { normalizeText } from "@/lib/matching";
import { getMeetings, saveMeetings } from "@/lib/storage";
import type { PersonGroup } from "@/lib/types";
import { HubSpotSlot } from "./HubSpotSlot";
import { RelationshipSummarySlot } from "./RelationshipSummarySlot";

type PeopleListProps = {
  people: PersonGroup[];
  confirmedNames: string[];
};

function formatCapturedDate(capturedAt: string): string {
  if (typeof capturedAt !== "string" || !capturedAt) return "Date unknown";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(capturedAt);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return "Date unknown";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function matchLevelLabel(
  matchLevel: PersonGroup["matchLevel"],
  confirmedSamePerson: boolean,
): string {
  if (matchLevel === "exact") return "Exact match";
  if (matchLevel === "likely" && confirmedSamePerson) {
    return "Confirmed same person";
  }
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
  return typeof note === "string" && note.trim().length > 0;
}

function latestMeeting(personGroup: PersonGroup): PersonGroup["meetings"][number] | undefined {
  return [...personGroup.meetings].sort((first, second) =>
    first.capturedAt < second.capturedAt ? 1 : -1,
  )[0];
}

function currentCompany(personGroup: PersonGroup): string {
  return latestMeeting(personGroup)?.company ?? "";
}

function uniqueNames(personGroup: PersonGroup): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const meeting of personGroup.meetings) {
    const name = meeting.personName.trim();
    const key = normalizeText(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
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

export function PeopleList({ people, confirmedNames }: PeopleListProps) {
  const [peopleGroups, setPeopleGroups] = useState(people);
  const [addingNoteForMeetingId, setAddingNoteForMeetingId] = useState<
    string | null
  >(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingEmailForGroupKey, setEditingEmailForGroupKey] = useState<
    string | null
  >(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [searchText, setSearchText] = useState("");
  const [peopleFilter, setPeopleFilter] = useState("all");

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
    if (!saveMeetings(updatedMeetings)) return;

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
    if (!saveMeetings(updatedMeetings)) return;

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

  const visiblePeople = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return peopleGroups.filter((personGroup) => {
      const emails = uniqueEmails(personGroup);
      const latest = latestMeeting(personGroup);
      if (peopleFilter === "interested" && latest?.interest !== "interested") {
        return false;
      }
      if (peopleFilter === "not_now" && latest?.interest !== "not_now") {
        return false;
      }
      if (peopleFilter === "missing_email" && emails.length > 0) {
        return false;
      }
      if (!query) return true;
      const names = uniqueNames(personGroup).join(" ");
      const companies = uniqueCompanies(personGroup).join(" ");
      const events = personGroup.meetings
        .map(
          (meeting) =>
            getConferenceById(meeting.conferenceId)?.name ?? meeting.conferenceId,
        )
        .join(" ");
      return `${names} ${companies} ${events}`.toLowerCase().includes(query);
    });
  }, [peopleGroups, peopleFilter, searchText]);

  if (peopleGroups.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center">
        <p className="text-sm text-neutral-700">
          No contacts yet. Add the first person you meet at an event.
        </p>
        <Link
          href="/floor"
          className="mt-3 inline-block rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Capture a lead
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Contacts</h2>
          <p className="text-sm text-neutral-600">
            {visiblePeople.length} of {peopleGroups.length} people
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <label className="sr-only" htmlFor="people-search">
            Search
          </label>
          <input
            id="people-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search name, company, event…"
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm sm:w-64"
          />
          <label className="sr-only" htmlFor="people-filter">
            Filter
          </label>
          <select
            id="people-filter"
            value={peopleFilter}
            onChange={(event) => setPeopleFilter(event.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm sm:w-40"
          >
            <option value="all">All people</option>
            <option value="interested">Interested</option>
            <option value="not_now">Not now</option>
            <option value="missing_email">Missing email</option>
          </select>
        </div>
      </div>
      {visiblePeople.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-700">
          No people match these filters. Try another search or filter.
        </p>
      ) : null}
      <ul className="mt-3 grid items-start gap-3 lg:grid-cols-2">
        {visiblePeople.map((personGroup) => {
          const names = uniqueNames(personGroup);
          const personName = latestMeeting(personGroup)?.personName ?? names[0] ?? "Unknown";
          const companies = uniqueCompanies(personGroup);
          const emails = uniqueEmails(personGroup);
          const linkedinUrls = uniqueLinkedinUrls(personGroup);
          const isEditingEmail = editingEmailForGroupKey === personGroup.key;
          const headerCompany = currentCompany(personGroup);
          const meetingCount = personGroup.meetings.length;
          const confirmedSamePerson = confirmedNames.includes(
            normalizeText(personName),
          );

          return (
            <li
              key={personGroup.key}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="break-words text-base font-semibold text-neutral-900">
                      {names.length > 0 ? names.join(" · ") : personName}
                    </h3>
                    <span className="text-xs text-neutral-600">
                      {meetingCount} {meetingCount === 1 ? "meeting" : "meetings"}
                    </span>
                  </div>
                  <p className="mt-0.5 break-words text-sm font-medium text-neutral-700">
                    {companies.join(" · ")}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
                    {emails.length > 0 ? (
                      <span className="break-all">{emails.join(" · ")}</span>
                    ) : null}
                    {isEditingEmail ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="email"
                          value={emailDraft}
                          onChange={(event) => setEmailDraft(event.target.value)}
                          maxLength={254}
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

                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                  {matchLevelLabel(personGroup.matchLevel, confirmedSamePerson)}
                </span>
              </div>

              {personGroup.companyChanged ? (
                <p className="mt-1 text-xs text-amber-700">
                  Met under different companies
                </p>
              ) : null}

              <ul className="mt-3 border-t border-neutral-200 pt-3">
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
                    <li
                      key={meeting.id}
                      className="border-l border-neutral-200 py-1.5 pl-3"
                    >
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
                        <p className="mt-0.5 break-words text-xs leading-snug text-neutral-600">
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
                            maxLength={1000}
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

              <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-200 pt-3">
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
