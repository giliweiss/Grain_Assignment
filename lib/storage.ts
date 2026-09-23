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

function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded(): void {
  if (!canUseLocalStorage()) return;
  if (localStorage.getItem(SEEDED_KEY) === "true") return;
  writeJson(MEETINGS_KEY, seedMeetingList);
  writeJson(CONFIRMATIONS_KEY, []);
  localStorage.setItem(SEEDED_KEY, "true");
}

export function getSeedMeetings(): Meeting[] {
  return seedMeetingList.map((meeting) => ({ ...meeting }));
}

export function getMeetings(): Meeting[] {
  if (!canUseLocalStorage()) return getSeedMeetings();
  ensureSeeded();
  return readJson<Meeting[]>(MEETINGS_KEY, getSeedMeetings());
}

export function saveMeetings(meetings: Meeting[]): void {
  if (!canUseLocalStorage()) return;
  ensureSeeded();
  writeJson(MEETINGS_KEY, meetings);
}

export function addMeeting(meeting: Meeting): void {
  const meetings = getMeetings();
  meetings.push(meeting);
  saveMeetings(meetings);
}

export function getConfirmations(): Confirmation[] {
  if (!canUseLocalStorage()) return [];
  ensureSeeded();
  return readJson<Confirmation[]>(CONFIRMATIONS_KEY, []);
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
  localStorage.setItem(SEEDED_KEY, "true");
}
