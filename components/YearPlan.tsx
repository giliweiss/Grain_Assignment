"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { findTripClusters } from "@/lib/clustering";
import { scoreConference } from "@/lib/scoring";
import type { Conference, Tier } from "@/lib/types";

type YearPlanProps = {
  conferences: Conference[];
  year: number;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  const month = { month: "short" as const };

  if (startDate === endDate) {
    return start.toLocaleDateString("en-GB", { day: "numeric", ...month });
  }

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("en-GB", month)}`;
  }

  return `${start.toLocaleDateString("en-GB", { day: "numeric", ...month })} – ${end.toLocaleDateString("en-GB", { day: "numeric", ...month })}`;
}

function tierDotClassName(tier: Tier): string {
  if (tier === "Strong") return "bg-emerald-500";
  if (tier === "Worth a look") return "bg-amber-500";
  return "bg-neutral-400";
}

function conferencesByMonth(
  conferences: Conference[],
  year: number,
): Map<number, Conference[]> {
  const byMonth = new Map<number, Conference[]>();

  for (let month = 1; month <= 12; month += 1) {
    byMonth.set(month, []);
  }

  for (const conference of conferences) {
    const [conferenceYear, conferenceMonth] = conference.startDate
      .split("-")
      .map(Number);
    if (conferenceYear !== year) continue;
    const list = byMonth.get(conferenceMonth) ?? [];
    list.push(conference);
    byMonth.set(conferenceMonth, list);
  }

  for (const list of byMonth.values()) {
    list.sort((left, right) => left.startDate.localeCompare(right.startDate));
  }

  return byMonth;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventsOnDay(conferences: Conference[], key: string): Conference[] {
  return conferences.filter(
    (conference) => conference.startDate <= key && conference.endDate >= key,
  );
}

export function YearPlan({ conferences, year }: YearPlanProps) {
  const tripClusters = findTripClusters(conferences);
  const byMonth = useMemo(
    () => conferencesByMonth(conferences, year),
    [conferences, year],
  );
  const conferenceById = new Map(
    conferences.map((conference) => [conference.id, conference]),
  );
  const firstMonthWithEvents =
    monthNames.findIndex((_, index) => (byMonth.get(index + 1) ?? []).length > 0) + 1;
  const [selectedMonth, setSelectedMonth] = useState(
    firstMonthWithEvents > 0 ? firstMonthWithEvents : 1,
  );

  const selectedConferences = byMonth.get(selectedMonth) ?? [];
  const selectedMonthName = monthNames[selectedMonth - 1];
  const daysInMonth = new Date(year, selectedMonth, 0).getDate();
  const firstWeekday = new Date(year, selectedMonth - 1, 1).getDay();
  const leadingBlanks = (firstWeekday + 6) % 7;
  const cells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mt-4">
      <details className="border-b border-neutral-200 pb-3">
        <summary className="text-sm font-medium text-neutral-900">
          Possible trip windows{" "}
          <span className="font-normal text-neutral-600">({tripClusters.length})</span>
        </summary>
        <div className="mt-3">
          <p className="text-sm text-neutral-600">
            Events in the same region with start dates within 14 days. Check the
            cities and travel time before combining them.
          </p>
          {tripClusters.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">
              No event groups meet this date and region rule.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
              {tripClusters.map((cluster) => {
                const clusterConferences = cluster.conferenceIds
                  .map((id) => conferenceById.get(id))
                  .filter((conference): conference is Conference =>
                    Boolean(conference),
                  );
                const cities = [
                  ...new Set(clusterConferences.map((conference) => conference.city)),
                ];

                return (
                  <li
                    key={`${cluster.region}-${cluster.conferenceIds.join("-")}`}
                    className="rounded-xl border border-neutral-200 bg-white p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          Possible grouping
                        </p>
                        <h3 className="text-base font-semibold text-neutral-900">
                          {cluster.region}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                        {cluster.dayGap}-day span
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-700">{cities.join(" → ")}</p>
                    <ul className="mt-2 divide-y divide-neutral-200 border-t border-neutral-200">
                      {clusterConferences.map((conference) => (
                        <li
                          key={conference.id}
                          className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5"
                        >
                          <Link
                            href={`/conferences#${conference.id}`}
                            className="text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                          >
                            {conference.name}
                          </Link>
                          <span className="text-xs text-neutral-500">
                            {formatDateRange(conference.startDate, conference.endDate)}
                            {" · "}
                            {conference.city}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>

      <section className="mt-4" aria-labelledby="year-plan-months">
        <h2 id="year-plan-months" className="mb-2 text-sm font-medium text-neutral-900">
          Months
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {monthNames.map((monthName, index) => {
            const month = index + 1;
            const count = (byMonth.get(month) ?? []).length;
            const selected = month === selectedMonth;
            return (
              <button
                key={monthName}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedMonth(month)}
                className={`flex w-20 shrink-0 flex-col rounded-md border px-2 py-2 text-left ${
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                }`}
              >
                <span className="text-sm font-medium">{monthName.slice(0, 3)}</span>
                <span
                  className={`text-xs tabular-nums ${selected ? "text-neutral-200" : "text-neutral-600"}`}
                >
                  {count} {count === 1 ? "event" : "events"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-neutral-900">
            {selectedMonthName} {year}
          </h2>
          <p className="text-sm tabular-nums text-neutral-600">
            {selectedConferences.length}{" "}
            {selectedConferences.length === 1 ? "event" : "events"}
          </p>
        </div>

        <div className="mt-4 lg:grid lg:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="grid grid-cols-7 gap-1">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="text-center text-xs font-medium text-neutral-500"
                >
                  {label}
                </div>
              ))}
              {cells.map((day, index) => {
                if (day === null) {
                  return <div key={`blank-${index}`} />;
                }
                const key = dateKey(year, selectedMonth, day);
                const dayEvents = eventsOnDay(selectedConferences, key);
                const hasEvents = dayEvents.length > 0;
                return (
                  <div
                    key={key}
                    title={dayEvents.map((conference) => conference.name).join(", ")}
                    className={`flex min-h-12 flex-col items-center rounded-md py-1 text-sm ${
                      hasEvents
                        ? "bg-neutral-100 font-semibold text-neutral-900"
                        : "text-neutral-600"
                    }`}
                  >
                    <span>{day}</span>
                    <span className="sr-only">
                      {hasEvents
                        ? dayEvents.map((conference) => conference.name).join(", ")
                        : "No events"}
                    </span>
                    {hasEvents ? (
                      <span className="mt-1 flex justify-center gap-0.5">
                        {dayEvents.map((conference) => (
                          <span
                            key={conference.id}
                            className={`size-2 rounded-full ${tierDotClassName(scoreConference(conference).tier)}`}
                            aria-hidden
                          />
                        ))}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-200 pt-4 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
            <h3 className="text-sm font-semibold text-neutral-900">Events this month</h3>
            {selectedConferences.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">
                No listed events in {selectedMonthName}.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-neutral-200">
                {selectedConferences.map((conference) => {
                  const tier = scoreConference(conference).tier;
                  return (
                    <li key={conference.id} className="flex gap-2 py-2">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${tierDotClassName(tier)}`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/conferences#${conference.id}`}
                          className="break-words text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                        >
                          {conference.name}
                        </Link>
                        <p className="text-xs text-neutral-600">
                          {formatDateRange(conference.startDate, conference.endDate)}
                          {" · "}
                          {conference.city}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <ul className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-600">
              {(["Strong", "Worth a look", "Skip"] as const).map((tier) => (
                <li key={tier} className="flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${tierDotClassName(tier)}`}
                    aria-hidden
                  />
                  {tier}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
