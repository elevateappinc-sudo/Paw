import { Skeleton } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";

/** Fila skeleton con la geometría de BusinessCard (foto 104×88 + nombre, metadatos, reseñas y chips). */
export function SkeletonBizRow() {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface p-3" aria-hidden="true">
      <Skeleton className="h-22 w-26 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Pantalla completa de carga de Explorar: cabecera real, mapa en skeleton y hoja con 3 filas. */
export function ExplorarSkeleton() {
  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto w-full max-w-[640px] overflow-hidden bg-bg" aria-busy="true" role="status" aria-label="Cargando lugares cercanos">
      <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 bg-bg pb-3 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3 px-4">
          <h1 className="text-display font-semibold text-text">Explorar</h1>
          <SOSButton />
        </div>
        <div className="px-4">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="flex gap-2 px-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
      <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[45dvh] w-full max-w-[640px] flex-col gap-3 rounded-t-xl border-t border-border bg-surface-elevated px-4 pt-2">
        <div className="mx-auto h-1 w-8 rounded-full bg-border" />
        <Skeleton className="h-6 w-40" />
        <SkeletonBizRow />
        <SkeletonBizRow />
      </div>
    </div>
  );
}
