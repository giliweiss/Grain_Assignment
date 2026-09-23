import { FloorForm } from "@/components/FloorForm";
import { getConferenceById } from "@/lib/conferences";

type FloorPageProps = {
  searchParams: Promise<{ conference?: string | string[] }>;
};

export default async function FloorPage({ searchParams }: FloorPageProps) {
  const params = await searchParams;
  const conferenceParam = params.conference;
  const conferenceId =
    typeof conferenceParam === "string" ? conferenceParam : undefined;
  const initialConferenceId =
    conferenceId && getConferenceById(conferenceId) ? conferenceId : "";

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-semibold text-neutral-900">On the Floor</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Capture a lead between conversations.
      </p>
      <FloorForm initialConferenceId={initialConferenceId} />
    </main>
  );
}
