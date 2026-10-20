import { RouteFallback } from "@/components/ui/Skeleton";
import { AlimentacionSkeleton } from "@/components/alimentacion/AlimentacionSkeleton";

function LoadingContent() {
  return <AlimentacionSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
