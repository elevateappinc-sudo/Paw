import { Skeleton } from "@/components/ui";

/** Misma geometría que la galería mientras cargan las fotos. */
export function GallerySkeleton() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Cargando galería">
      <div className="flex items-end justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="flex gap-1.5 px-4 py-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="px-4">
        <Skeleton className="mb-2.5 h-4 w-28" />
        <div className="grid grid-cols-3 gap-1 md:grid-cols-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
