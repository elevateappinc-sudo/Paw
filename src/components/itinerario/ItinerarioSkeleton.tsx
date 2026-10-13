import { Skeleton, SkeletonRow } from "@/components/ui";

export function ItinerarioSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-6" aria-busy="true" aria-label="Cargando rutina diaria">
      <div className="flex items-end justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 w-10 rounded-control" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <div className="px-4">
        <Skeleton className="h-[88px] rounded-card-lg" />
      </div>
      <div className="px-4">
        <Skeleton className="mb-3 h-6 w-20" />
        <div className="overflow-hidden rounded-card-lg border border-outline-variant bg-surface">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  );
}
