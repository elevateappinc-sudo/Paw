import { RouteFallback } from "@/components/ui/Skeleton";
import { LostPetRadar } from "@/components/ui";
import { LostModeRoot } from "@/components/perdida/LostMode";

/** Comunidad: buscando reportes cercanos (radar, exclusivo del modo perdida) */
function LoadingContent() {
  return (
    <LostModeRoot>
      <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <h1 className="text-display font-semibold text-text">Mascotas perdidas</h1>
      </div>
      <div className="flex flex-1 items-center justify-center py-12">
        <LostPetRadar showLabel label="Buscando reportes cercanos" />
      </div>
    </LostModeRoot>
  );
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
