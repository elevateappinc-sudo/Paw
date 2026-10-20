import { RouteFallback } from "@/components/ui/Skeleton";
import { EventsSkeleton } from "@/components/eventos/EventsSkeleton";

function LoadingContent() {
  return <EventsSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
