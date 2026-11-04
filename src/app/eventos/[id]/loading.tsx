import { RouteFallback } from "@/components/ui/Skeleton";
import { EventDetailSkeleton } from "@/components/eventos/EventsSkeleton";

function LoadingContent() {
  return <EventDetailSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
