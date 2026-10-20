import { Skeleton } from "@/components/ui";

export function BusinessSkeleton() {
  return (
    <div className="min-h-dvh bg-bg pb-32" aria-busy="true" aria-label="Cargando negocio">
      <Skeleton className="h-[280px] w-full rounded-none" />
      <div className="flex flex-col gap-3 px-4 pt-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Skeleton className="h-11 rounded-full" />
          <Skeleton className="h-11 rounded-full" />
          <Skeleton className="h-11 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-[180px] w-full rounded-md" />
        <Skeleton className="h-[140px] w-full rounded-md" />
        <Skeleton className="h-[200px] w-full rounded-md" />
      </div>
    </div>
  );
}
