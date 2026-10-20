import { Skeleton, SkeletonRow } from "@/components/ui";

export function ItinerarioSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-6" aria-busy="true" aria-label="Cargando rutina diaria">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <div className="flex items-end gap-2">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <div className="px-4">
        <Skeleton className="h-[88px] rounded-md" />
      </div>
      <div className="px-4">
        <Skeleton className="mb-3 h-6 w-20" />
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  );
}
