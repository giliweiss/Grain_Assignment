import { findThinMonths, findTripClusters } from "@/lib/clustering";
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

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  const startLabel = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });

  if (startDate === endDate) {
    return startLabel;
  }

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("en-GB", {
      month: "short",
    })}`;
  }

  return `${startLabel} – ${endLabel}`;
}

function tierClassName(tier: Tier): string {
  if (tier === "Strong") {
    return "bg-emerald-100 text-emerald-900";
  }
  if (tier === "Worth a look") {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-neutral-200 text-neutral-700";
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

export function YearPlan({ conferences, year }: YearPlanProps) {
  const thinMonths = new Set(findThinMonths(conferences, year));
  const tripClusters = findTripClusters(conferences);
  const byMonth = conferencesByMonth(conferences, year);
  const conferenceById = new Map(
    conferences.map((conference) => [conference.id, conference]),
  );

  const activeMonths = monthNames.flatMap((monthName, index) => {
    const month = index + 1;
    const monthConferences = byMonth.get(month) ?? [];
    if (monthConferences.length === 0) return [];
    return [
      {
        monthName,
        monthConferences,
        isThin: thinMonths.has(month),
      },
    ];
  });

  const emptyMonthNames = monthNames.filter((_, index) => {
    const monthConferences = byMonth.get(index + 1) ?? [];
    return monthConferences.length === 0;
  });

  return (
    <div className="mt-4 space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Trip clusters</h2>
        {tripClusters.length === 0 ? (
          <p className="mt-1.5 text-sm text-neutral-600">
            No same-region clusters within 14 days.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2 lg:grid-cols-2">
            {tripClusters.map((cluster) => {
              const clusterConferences = cluster.conferenceIds
                .map((id) => conferenceById.get(id))
                .filter((conference): conference is Conference =>
                  Boolean(conference),
                );
              const cities = [
                ...new Set(
                  clusterConferences.map((conference) => conference.city),
                ),
              ];

              return (
                <li
                  key={`${cluster.region}-${cluster.conferenceIds.join("-")}`}
                  className="rounded-md border border-neutral-200 border-l-4 border-l-neutral-900 bg-white px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        Combined trip
                      </p>
                      <h3 className="text-base font-semibold text-neutral-900">
                        {cluster.region}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                      {cluster.dayGap}-day gap
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {cities.join(" → ")}
                  </p>
                  <ul className="mt-2 divide-y divide-neutral-100 border-t border-neutral-100">
                    {clusterConferences.map((conference) => (
                      <li
                        key={conference.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5"
                      >
                        <span className="text-sm font-medium text-neutral-900">
                          {conference.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatDateRange(
                            conference.startDate,
                            conference.endDate,
                          )}
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
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Months</h2>
        <div className="mt-2 grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeMonths.map(({ monthName, monthConferences, isThin }) => (
            <div
              key={monthName}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-neutral-900">
                  {monthName}
                </h3>
                <span className="flex items-center gap-1.5">
                  {isThin ? (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      No strong events
                    </span>
                  ) : null}
                  <span className="text-xs text-neutral-600">
                    {monthConferences.length}
                  </span>
                </span>
              </div>
              <ul className="mt-1 divide-y divide-neutral-100">
                {monthConferences.map((conference) => {
                  const score = scoreConference(conference);
                  return (
                    <li
                      key={conference.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 py-1.5"
                    >
                      <span
                        className={`mt-0.5 h-fit rounded px-1 py-0.5 text-[10px] font-medium ${tierClassName(score.tier)}`}
                      >
                        {score.tier}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug text-neutral-900">
                          {conference.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDateRange(
                            conference.startDate,
                            conference.endDate,
                          )}
                          {" · "}
                          {conference.city}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {emptyMonthNames.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              No strong events
            </span>
            {emptyMonthNames.map((monthName) => (
              <span
                key={monthName}
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500"
              >
                {monthName}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
