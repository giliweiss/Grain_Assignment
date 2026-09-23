import conferencesData from "@/data/conferences.json";
import { YearPlan } from "@/components/YearPlan";
import type { Conference } from "@/lib/types";

const conferences = conferencesData as Conference[];
const planYear = 2026;

export default function YearPlanPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Year Plan</h1>
        <p className="text-sm text-neutral-600">{planYear}</p>
      </div>
      <YearPlan conferences={conferences} year={planYear} />
    </main>
  );
}
