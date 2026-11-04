import { RouteFallback } from "@/components/ui/Skeleton";
import { CitasSkeleton } from "@/components/citas/CitasSkeleton";

function LoadingContent() {
  return <CitasSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
