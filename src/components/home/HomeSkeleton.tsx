import { Skeleton, SkeletonBiz, SkeletonPets } from "@/components/ui";

/** Esqueleto de Inicio con la misma geometría que HomeScreen */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-6" aria-busy="true" aria-label="Cargando inicio">
      <div className="flex items-end justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-14 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <div className="px-4">
        <Skeleton className="h-[148px] w-full rounded-card-lg" />
      </div>
      <SkeletonPets />
      <div className="px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-[196px] w-full rounded-card-lg" />
      </div>
      <div className="px-4">
        <Skeleton className="h-5 w-36" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-16 w-16 rounded-[20px]" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="px-4">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4">
          <SkeletonBiz />
          <SkeletonBiz />
          <SkeletonBiz />
        </div>
      </div>
      <div className="px-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-[88px] w-full rounded-card-lg" />
      </div>
    </div>
  );
}
