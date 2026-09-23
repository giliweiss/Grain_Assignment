import { scoreConference } from "./scoring";
import type { Conference, TripCluster } from "./types";

function daysBetween(earlierDate: string, laterDate: string): number {
  const [earlyYear, earlyMonth, earlyDay] = earlierDate.split("-").map(Number);
  const [laterYear, laterMonth, laterDay] = laterDate.split("-").map(Number);
  const earlyUtc = Date.UTC(earlyYear, earlyMonth - 1, earlyDay);
  const laterUtc = Date.UTC(laterYear, laterMonth - 1, laterDay);
  return Math.round((laterUtc - earlyUtc) / 86_400_000);
}

export function findTripClusters(conferences: Conference[]): TripCluster[] {
  const byRegion = new Map<Conference["region"], Conference[]>();

  for (const conference of conferences) {
    const list = byRegion.get(conference.region) ?? [];
    list.push(conference);
    byRegion.set(conference.region, list);
  }

  const clusters: TripCluster[] = [];

  for (const [region, list] of byRegion) {
    const sorted = [...list].sort((left, right) => left.startDate.localeCompare(right.startDate));
    let current: Conference[] = [];

    const closeCurrent = () => {
      if (current.length < 2) return;
      clusters.push({
        region,
        conferenceIds: current.map((conference) => conference.id),
        dayGap: daysBetween(current[0].startDate, current[current.length - 1].startDate),
      });
    };

    for (const conference of sorted) {
      if (current.length === 0) {
        current = [conference];
        continue;
      }

      const withinWindow = daysBetween(current[0].startDate, conference.startDate) <= 14;
      if (withinWindow) {
        current.push(conference);
      } else {
        closeCurrent();
        current = [conference];
      }
    }

    closeCurrent();
  }

  return clusters;
}

export function findThinMonths(conferences: Conference[], year: number): number[] {
  const strongMonths = new Set<number>();

  for (const conference of conferences) {
    const [conferenceYear, conferenceMonth] = conference.startDate.split("-").map(Number);
    if (conferenceYear !== year) continue;
    if (scoreConference(conference).tier === "Strong") strongMonths.add(conferenceMonth);
  }

  const thinMonths: number[] = [];
  for (let month = 1; month <= 12; month += 1) {
    if (!strongMonths.has(month)) thinMonths.push(month);
  }
  return thinMonths;
}
