import { RouteFallback } from "@/components/ui/Skeleton";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";

function LoadingContent() {
  return <GallerySkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
