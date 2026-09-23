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

function tierBadgeClassName(tier: string): string {
  if (tier === "Strong") {
    return "bg-emerald-100 text-emerald-900";
  }
  if (tier === "Worth a look") {
    return "bg-amber-100 text-amber-950";
  }
  return "bg-neutral-200 text-neutral-700";
}

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

      <div className="mt-4 space-y-6">
        {tierOrder.map((tier) => {
          const tierConferences = visibleConferences.filter(
            (conference) => scoreConference(conference).tier === tier,
          );
          if (tierConferences.length === 0) {
            return null;
          }

          return (
            <section key={tier}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${tierMarkerClassName(tier)}`}
                  aria-hidden
                />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {tier}
                </h2>
                <span className="text-xs text-neutral-600">
                  {tierConferences.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {tierConferences.map((conference) => {
                  const score = scoreConference(conference);
                  return (
                    <li
                      key={conference.id}
                      className="rounded-md border border-neutral-200 bg-white px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 break-words text-base font-semibold leading-tight text-neutral-900">
                          {conference.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${tierBadgeClassName(score.tier)}`}
                        >
                          {score.tier}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-700">
                        {formatDateRange(conference.startDate, conference.endDate)}
                        {" · "}
                        {conference.city}, {conference.country}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        <span className="capitalize">{conference.vertical}</span>
                        {" · "}
                        {conference.audienceSize.toLocaleString("en-US")} people
                        {" · "}
                        {conference.region}
                      </p>
                      {score.reasons.length > 0 ? (
                        <ul className="mt-1.5 flex flex-wrap gap-1">
                          {score.reasons.map((reason) => (
                            <li
                              key={reason}
                              className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] text-neutral-600"
                            >
                              {reason}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/floor?conference=${conference.id}`}
                          className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-sm font-medium text-white"
                        >
                          Capture on the floor
                        </Link>
                        <a
                          href={conference.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-500"
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
