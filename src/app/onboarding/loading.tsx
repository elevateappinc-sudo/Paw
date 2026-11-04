import { RouteFallback } from "@/components/ui/Skeleton";
import { PetSilhouetteLoader } from "@/components/ui";

/** Primer arranque: silueta en movimiento mientras se prepara el alta */
function LoadingContent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-8">
      <PetSilhouetteLoader showLabel label="Preparando todo para tu mascota" />
    </div>
  );
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
