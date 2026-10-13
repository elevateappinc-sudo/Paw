import { Suspense } from "react";
import { EventDetail } from "@/components/eventos/EventDetail";
import { EventDetailSkeleton } from "@/components/eventos/EventsSkeleton";

export const metadata = { title: "Evento · Paw" };

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetail id={id} />
    </Suspense>
  );
}
