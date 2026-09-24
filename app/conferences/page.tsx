import { ConferenceList } from "@/components/ConferenceList";
import { getConferences } from "@/lib/conferences";

export default function ConferencesPage() {
  const conferences = getConferences();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Conferences</h1>
      <ConferenceList conferences={conferences} />
    </main>
  );
}
