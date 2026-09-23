import seedMeetings from "@/data/seed-meetings.json";
import { normalizeText } from "@/lib/matching";
import type { Confirmation, Meeting } from "@/lib/types";

const MEETINGS_KEY = "grain.meetings";
const CONFIRMATIONS_KEY = "grain.confirmations";
const SEEDED_KEY = "grain.seeded";

const seedMeetingList = seedMeetings as Meeting[];

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson(key: string): unknown {
  if (!canUseLocalStorage()) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (!canUseLocalStorage()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function sanitizeMeeting(value: unknown): Meeting | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) return null;
  if (typeof record.conferenceId !== "string" || !record.conferenceId.trim()) return null;
  if (typeof record.personName !== "string" || !record.personName.trim()) return null;
  if (typeof record.company !== "string" || !record.company.trim()) return null;

  const meeting: Meeting = {
    id: record.id.trim(),
    conferenceId: record.conferenceId.trim(),
    capturedAt: typeof record.capturedAt === "string" ? record.capturedAt : "",
    personName: record.personName.trim(),
    company: record.company.trim(),
    note: typeof record.note === "string" ? record.note : "",
    interest: record.interest === "interested" ? "interested" : "not_now",
  };

  if (typeof record.email === "string" && record.email.trim()) {
    meeting.email = record.email.trim();
  }
  if (typeof record.linkedinUrl === "string" && record.linkedinUrl.trim()) {
    meeting.linkedinUrl = record.linkedinUrl.trim();
  }

  return meeting;
}

function readMeetings(): Meeting[] {
  const parsed = readJson(MEETINGS_KEY);
  if (!Array.isArray(parsed)) return getSeedMeetings();

  const seenIds = new Set<string>();
  const meetings: Meeting[] = [];
  for (const item of parsed) {
    const meeting = sanitizeMeeting(item);
    if (!meeting || seenIds.has(meeting.id)) continue;
    seenIds.add(meeting.id);
    meetings.push(meeting);
  }
  return meetings;
}

function readConfirmations(): Confirmation[] {
  const parsed = readJson(CONFIRMATIONS_KEY);
  if (!Array.isArray(parsed)) return [];

  const confirmations = new Map<string, Confirmation>();
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.normalizedName !== "string") continue;
    if (record.decision !== "same_person" && record.decision !== "different_people") continue;
    const normalizedName = normalizeText(record.normalizedName);
    if (!normalizedName) continue;
    confirmations.set(normalizedName, { normalizedName, decision: record.decision });
  }
  return [...confirmations.values()];
}

function ensureSeeded(): void {
  if (!canUseLocalStorage()) return;
  if (localStorage.getItem(SEEDED_KEY) === "true") return;
  writeJson(MEETINGS_KEY, seedMeetingList);
  writeJson(CONFIRMATIONS_KEY, []);
  try {
    localStorage.setItem(SEEDED_KEY, "true");
  } catch {
    return;
  }
}

export function getSeedMeetings(): Meeting[] {
  return seedMeetingList.map((meeting) => ({ ...meeting }));
}

export function getMeetings(): Meeting[] {
  if (!canUseLocalStorage()) return getSeedMeetings();
  ensureSeeded();
  return readMeetings();
}

export function saveMeetings(meetings: Meeting[]): boolean {
  if (!canUseLocalStorage()) return false;
  ensureSeeded();
  return writeJson(MEETINGS_KEY, meetings);
}

export function addMeeting(meeting: Meeting): boolean {
  const meetings = getMeetings();
  meetings.push(meeting);
  return saveMeetings(meetings);
}

export function getConfirmations(): Confirmation[] {
  if (!canUseLocalStorage()) return [];
  ensureSeeded();
  return readConfirmations();
}

export function saveConfirmations(confirmations: Confirmation[]): void {
  if (!canUseLocalStorage()) return;
  ensureSeeded();
  writeJson(CONFIRMATIONS_KEY, confirmations);
}

export function setConfirmation(
  personName: string,
  decision: Confirmation["decision"],
): void {
  const normalizedName = normalizeText(personName);
  if (!normalizedName) return;

  const confirmations = getConfirmations().filter(
    (confirmation) => confirmation.normalizedName !== normalizedName,
  );
  confirmations.push({ normalizedName, decision });
  saveConfirmations(confirmations);
}

export function resetDemoData(): void {
  if (!canUseLocalStorage()) return;
  writeJson(MEETINGS_KEY, seedMeetingList);
  writeJson(CONFIRMATIONS_KEY, []);
  try {
    localStorage.setItem(SEEDED_KEY, "true");
  } catch {
    return;
  }
}
