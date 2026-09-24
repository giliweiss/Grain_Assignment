"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  filterConferences,
  type ConferenceFilters as ConferenceFilterValues,
} from "@/lib/conferences";
import { scoreConference } from "@/lib/scoring";
import type { Conference } from "@/lib/types";
import { ConferenceFilters } from "./ConferenceFilters";

type ConferenceListProps = {
  conferences: Conference[];
};

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  const startLabel = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameMonth ? undefined : "numeric",
  });

  if (startDate === endDate) {
    return startLabel;
  }

  if (sameMonth) {
    return `${start.getDate()}–${endLabel} ${start.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    })}`;
  }

  return `${startLabel} – ${endLabel}`;
}

const tierOrder = ["Strong", "Worth a look", "Skip"] as const;

function tierMarkerClassName(tier: string): string {
  if (tier === "Strong") {
    return "bg-emerald-500";
  }
  if (tier === "Worth a look") {
    return "bg-amber-500";
  }
  return "bg-neutral-400";
}

export function ConferenceList({ conferences }: ConferenceListProps) {
  const [filters, setFilters] = useState<ConferenceFilterValues>({
    text: "",
    vertical: "all",
    region: "all",
    tier: "all",
  });

  const visibleConferences = useMemo(() => {
    return filterConferences(conferences, filters).sort((left, right) => {
      const leftScore = scoreConference(left).points;
      const rightScore = scoreConference(right).points;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return left.startDate.localeCompare(right.startDate);
    });
  }, [conferences, filters]);

  return (
    <div>
      <ConferenceFilters filters={filters} onChange={setFilters} />

      <p className="mt-2 text-xs text-neutral-600">
        {visibleConferences.length} of {conferences.length}
      </p>

      <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {tierOrder.map((tier) => {
          const tierConferences = visibleConferences.filter(
            (conference) => scoreConference(conference).tier === tier,
          );
          if (tierConferences.length === 0) {
            return null;
          }

          return (
            <section
              key={tier}
              className="w-[min(86vw,22rem)] shrink-0 snap-start rounded-xl border border-neutral-200 bg-neutral-100/70 p-3 lg:w-auto lg:min-w-0"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span
                  className={`h-2 w-2 rounded-full ${tierMarkerClassName(tier)}`}
                  aria-hidden
                />
                <h2 className="text-sm font-semibold text-neutral-800">{tier}</h2>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-neutral-600">
                  {tierConferences.length}
                </span>
              </div>
              <ul className="space-y-3 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto lg:pr-1">
                {tierConferences.map((conference) => {
                  const score = scoreConference(conference);
                  return (
                    <li
                      key={conference.id}
                      id={conference.id}
                      className="flex flex-col rounded-xl border border-neutral-200 bg-white p-3.5 transition-colors hover:border-neutral-300"
                    >
                      <h3 className="break-words text-base font-semibold leading-snug text-neutral-900">
                        {conference.name}
                      </h3>
                      <p className="mt-1.5 text-sm text-neutral-700">
                        {formatDateRange(conference.startDate, conference.endDate)}
                        {" · "}
                        {conference.city}, {conference.country}
                      </p>
                      <p className="mt-1.5 text-xs text-neutral-600">
                        <span className="capitalize">{conference.vertical}</span>
                        {" · "}
                        {conference.audienceSize.toLocaleString("en-US")} people
                        {" · "}
                        {conference.region}
                      </p>
                      {score.reasons.length > 0 ? (
                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                          {score.reasons.map((reason) => (
                            <li
                              key={reason}
                              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] leading-none text-neutral-600"
                            >
                              {reason}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                        <Link
                          href={`/floor?conference=${conference.id}`}
                          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                        >
                          Quick capture
                        </Link>
                        <a
                          href={conference.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900"
                        >
                          Event site
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {visibleConferences.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No conferences match these filters.
        </p>
      ) : null}
    </div>
  );
}
