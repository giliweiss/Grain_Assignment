import conferencesData from "@/data/conferences.json";
import type { Conference, Region, Tier, Vertical } from "./types";
import { scoreConference } from "./scoring";

export type ConferenceFilters = {
  text: string;
  vertical: Vertical | "all";
  region: Region | "all";
  tier: Tier | "all";
};

export function getConferences(): Conference[] {
  return conferencesData as Conference[];
}

export function getConferenceById(conferenceId: string): Conference | undefined {
  return getConferences().find((conference) => conference.id === conferenceId);
}

export function filterConferences(
  conferences: Conference[],
  filters: ConferenceFilters,
): Conference[] {
  const searchText = filters.text.trim().toLowerCase();

  return conferences.filter((conference) => {
    const score = scoreConference(conference);

    if (filters.vertical !== "all" && conference.vertical !== filters.vertical) {
      return false;
    }

    if (filters.region !== "all" && conference.region !== filters.region) {
      return false;
    }

    if (filters.tier !== "all" && score.tier !== filters.tier) {
      return false;
    }

    if (!searchText) {
      return true;
    }

    const haystack = [
      conference.name,
      conference.city,
      conference.country,
      conference.vertical,
      conference.region,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchText);
  });
}
