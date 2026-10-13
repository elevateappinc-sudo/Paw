import { Suspense } from "react";
import type { Metadata } from "next";
import { ItinerarioModule } from "@/components/itinerario/ItinerarioModule";
import { ItinerarioSkeleton } from "@/components/itinerario/ItinerarioSkeleton";

export const metadata: Metadata = { title: "Rutina diaria" };

export default function ItinerarioPage() {
  return (
    <Suspense fallback={<ItinerarioSkeleton />}>
      <ItinerarioModule />
    </Suspense>
  );
}
