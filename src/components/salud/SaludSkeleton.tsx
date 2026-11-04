import { Skeleton, SkeletonRow } from "@/components/ui";

/** Misma geometría que la pantalla de Salud */
export function SaludSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-8" aria-busy="true" aria-label="Cargando salud">
      <div className="flex items-end justify-between pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
      </div>
      <Skeleton className="h-6 w-24" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md bg-surface">
            <SkeletonRow />
          </div>
        ))}
      </div>
      <Skeleton className="h-6 w-24" />
      <div className="rounded-md bg-surface">
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
      </div>
    </div>
  );
}
