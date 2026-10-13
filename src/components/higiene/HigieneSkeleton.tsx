import { Skeleton, SkeletonRow } from "@/components/ui";

/** Misma geometría que la pantalla de Higiene */
export function HigieneSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pb-8" aria-busy="true" aria-label="Cargando higiene">
      <div className="flex items-end justify-between pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 w-10 rounded-control" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-52" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <Skeleton className="h-[84px] w-full rounded-card-lg" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[150px] w-full rounded-card-lg" />)}
      </div>
      <div className="rounded-card-lg bg-surface">
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
      </div>
    </div>
  );
}
