import { RouteFallback } from "@/components/ui/Skeleton";
import { BusinessSkeleton } from "@/components/negocios/BusinessSkeleton";

function LoadingContent() {
  return <BusinessSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
