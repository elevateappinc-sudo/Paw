import { RouteFallback } from "@/components/ui/Skeleton";
import { RouteLoader } from "@/components/ui";

/** Cambio de pantalla: rastro de huellas (solo si tarda más de --loader-delay) */
export default function Loading() {
  return (
    <RouteFallback>
      <RouteLoader />
    </RouteFallback>
  );
}
