import { RouteFallback } from "@/components/ui/Skeleton";
import { HigieneSkeleton } from "@/components/higiene/HigieneSkeleton";

function LoadingContent() {
  return <HigieneSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
