import { Skeleton, SkeletonPets } from "@/components/ui";
import { TodayCardSkeleton } from "./TodayCard";

/** Esqueleto de Inicio con la misma geometría y orden que HomeScreen */
export function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando inicio">
      {/* Cabecera: saludo, SOS y avatar */}
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-16 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-6 pt-2">
        <SkeletonPets />
        <TodayCardSkeleton />
        {/* Servicios: fila de íconos circulares */}
        <div className="flex gap-4 overflow-hidden px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-14 shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        <div className="px-4">
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <div>
          <div className="flex min-h-11 items-center px-4">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="mt-1 flex gap-3 overflow-hidden px-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-40 shrink-0">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
