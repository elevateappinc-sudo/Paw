import { RouteFallback } from "@/components/ui/Skeleton";
import { ExplorarSkeleton } from "@/components/explorar/ExplorarSkeleton";

function LoadingContent() {
  return <ExplorarSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
