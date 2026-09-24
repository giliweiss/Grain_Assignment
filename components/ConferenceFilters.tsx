"use client";

import type { Region, Tier, Vertical } from "@/lib/types";
import type { ConferenceFilters as ConferenceFilterValues } from "@/lib/conferences";

const verticalOptions: Array<Vertical | "all"> = [
  "all",
  "payments",
  "fintech",
  "treasury",
  "travel",
  "saas",
  "general",
];

const regionOptions: Array<Region | "all"> = [
  "all",
  "Europe",
  "North America",
  "Middle East",
  "Asia-Pacific",
];

const tierOptions: Array<Tier | "all"> = [
  "all",
  "Strong",
  "Worth a look",
  "Skip",
];

type ConferenceFiltersProps = {
  filters: ConferenceFilterValues;
  onChange: (filters: ConferenceFilterValues) => void;
};

const controlClassName =
  "rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900";

const emptyFilters: ConferenceFilterValues = {
  text: "",
  vertical: "all",
  region: "all",
  tier: "all",
};

export function ConferenceFilters({ filters, onChange }: ConferenceFiltersProps) {
  const filtersAreActive =
    filters.text !== "" ||
    filters.vertical !== "all" ||
    filters.region !== "all" ||
    filters.tier !== "all";

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-0.5 text-xs font-medium text-neutral-500">
        Search
        <input
          type="search"
          value={filters.text}
          onChange={(event) => onChange({ ...filters, text: event.target.value })}
          placeholder="Name, city, vertical…"
          className={controlClassName}
        />
      </label>

      <label className="flex flex-col gap-0.5 text-xs font-medium text-neutral-500">
        Vertical
        <select
          value={filters.vertical}
          onChange={(event) =>
            onChange({
              ...filters,
              vertical: event.target.value as Vertical | "all",
            })
          }
          className={controlClassName}
        >
          {verticalOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All verticals" : option}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-0.5 text-xs font-medium text-neutral-500">
        Region
        <select
          value={filters.region}
          onChange={(event) =>
            onChange({
              ...filters,
              region: event.target.value as Region | "all",
            })
          }
          className={controlClassName}
        >
          {regionOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All regions" : option}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-0.5 text-xs font-medium text-neutral-500">
        Tier
        <select
          value={filters.tier}
          onChange={(event) =>
            onChange({
              ...filters,
              tier: event.target.value as Tier | "all",
            })
          }
          className={controlClassName}
        >
          {tierOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All tiers" : option}
            </option>
          ))}
        </select>
      </label>

      {filtersAreActive ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="button"
            onClick={() => onChange(emptyFilters)}
            className="text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
