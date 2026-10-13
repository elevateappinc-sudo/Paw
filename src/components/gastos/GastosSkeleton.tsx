import { Skeleton, SkeletonRow } from "@/components/ui";

/** Misma geometría que GastosModule mientras cargan los datos. */
export function GastosSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-6" aria-busy="true" aria-label="Cargando gastos">
      <div className="flex items-end justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[58px] rounded-control" />
          ))}
        </div>
      </div>
      <div className="px-4">
        <Skeleton className="h-[232px] rounded-card-lg" />
      </div>
      <div className="px-4">
        <div className="overflow-hidden rounded-card-lg border border-outline-variant bg-surface">
          <SkeletonRow trailing={false} />
          <SkeletonRow trailing={false} />
          <SkeletonRow trailing={false} />
        </div>
      </div>
    </div>
  );
}
