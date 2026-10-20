import { RouteFallback } from "@/components/ui/Skeleton";
import { ItinerarioSkeleton } from "@/components/itinerario/ItinerarioSkeleton";

function LoadingContent() {
  return <ItinerarioSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
