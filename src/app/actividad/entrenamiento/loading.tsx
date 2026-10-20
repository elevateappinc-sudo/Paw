import { RouteFallback } from "@/components/ui/Skeleton";
import { EntrenamientoSkeleton } from "@/components/entrenamiento/EntrenamientoSkeleton";

function LoadingContent() {
  return <EntrenamientoSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
