import { Skeleton } from "@/components/ui";

export function SkeletonBookingRow() {
  return (
    <div className="flex min-h-19 items-center gap-3 rounded-md border border-border bg-surface px-3 py-3" aria-hidden="true">
      <Skeleton className="h-14 w-14 shrink-0 rounded-sm" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}

export function CitasSkeleton() {
  return (
    <div className="min-h-dvh bg-bg" aria-busy="true" aria-label="Cargando citas">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-10 w-16 rounded-full" />
      </div>
      <div className="px-4 pt-2">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
      <div className="flex flex-col gap-3 px-4 pt-4">
        <SkeletonBookingRow />
        <SkeletonBookingRow />
        <SkeletonBookingRow />
      </div>
    </div>
  );
}

export function CitaDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-bg" aria-busy="true" aria-label="Cargando cita">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-3 px-4 pt-4">
        <Skeleton className="h-52 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
