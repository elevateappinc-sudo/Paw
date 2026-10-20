import { Skeleton } from "@/components/ui";

export function EventsSkeleton() {
  return (
    <div className="min-h-dvh bg-bg" aria-busy="true" aria-label="Cargando eventos">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-16 rounded-full" />
      </div>
      <div className="flex gap-2 px-4 pt-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <Skeleton className="h-[150px] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3 rounded-md border border-border bg-surface p-3">
            <Skeleton className="h-[60px] w-[52px] rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-bg" aria-busy="true" aria-label="Cargando evento">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-3 px-4 pt-2">
        <Skeleton className="h-[200px] w-full rounded-md" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    </div>
  );
}
