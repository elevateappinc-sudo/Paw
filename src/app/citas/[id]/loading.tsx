import { RouteFallback } from "@/components/ui/Skeleton";
import { CitaDetailSkeleton } from "@/components/citas/CitasSkeleton";

function LoadingContent() {
  return <CitaDetailSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
