import { Skeleton } from "@/components/ui";

/** Fila skeleton con la geometría de BusinessCard (104×88 + dos líneas + chips). */
export function SkeletonBizRow() {
  return (
    <div className="flex gap-3 rounded-card-lg border border-outline-variant bg-surface p-3" aria-hidden="true">
      <Skeleton className="h-[88px] w-[104px] shrink-0 rounded-card" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
        <div className="mt-auto flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Pantalla completa de carga de Explorar: mapa neutro + hoja con 3 filas. */
export function ExplorarSkeleton() {
  return (
    <div className="relative h-dvh w-full bg-map" aria-busy="true" aria-label="Cargando Explorar">
      <div className="absolute inset-x-0 top-0 flex flex-col gap-2 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-16 rounded-full" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[45dvh] w-full max-w-[640px] flex-col gap-3 rounded-t-sheet bg-surface px-4 pt-3">
        <div className="mx-auto h-[5px] w-9 rounded-full bg-outline-variant" />
        <Skeleton className="h-6 w-40" />
        <SkeletonBizRow />
        <SkeletonBizRow />
        <SkeletonBizRow />
      </div>
    </div>
  );
}
