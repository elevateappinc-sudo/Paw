import { Suspense } from "react";
import { EventsView } from "@/components/eventos/EventsView";
import { EventsSkeleton } from "@/components/eventos/EventsSkeleton";

export const metadata = { title: "Eventos · Paw" };

export default function EventosPage() {
  return (
    <Suspense fallback={<EventsSkeleton />}>
      <EventsView />
    </Suspense>
  );
}
