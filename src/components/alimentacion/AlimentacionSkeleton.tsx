import { Skeleton } from "@/components/ui";

/** Misma geometría que la pantalla de Alimentación */
export function AlimentacionSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pb-8" aria-busy="true" aria-label="Cargando alimentación">
      <div className="flex items-end justify-between pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 w-10 rounded-control" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <Skeleton className="h-[190px] w-full rounded-card-lg" />
      <Skeleton className="h-[220px] w-full rounded-card-lg" />
      <Skeleton className="h-[110px] w-full rounded-card-lg" />
      <Skeleton className="h-[130px] w-full rounded-card-lg" />
    </div>
  );
}
