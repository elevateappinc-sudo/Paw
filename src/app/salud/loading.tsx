import { RouteFallback } from "@/components/ui/Skeleton";
import { SaludSkeleton } from "@/components/salud/SaludSkeleton";

function LoadingContent() {
  return <SaludSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
