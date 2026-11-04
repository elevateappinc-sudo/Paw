import { RouteFallback } from "@/components/ui/Skeleton";
import { NotificacionesSkeleton } from "@/components/notificaciones/NotificacionesSkeleton";

function LoadingContent() {
  return <NotificacionesSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
