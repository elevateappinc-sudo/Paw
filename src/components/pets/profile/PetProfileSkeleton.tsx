import { Skeleton } from "@/components/ui";

/** Misma geometría que PetProfileScreen */
export function PetProfileSkeleton() {
  return (
    <div className="pb-6" aria-busy="true">
      <Skeleton className="h-[300px] w-full rounded-none" />
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
      </div>
      <div className="mt-4 flex gap-1 border-b border-outline-variant px-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="my-2 h-7 w-16" />
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-control" />
          ))}
        </div>
        <Skeleton className="h-[220px] w-full rounded-card-lg" />
        <Skeleton className="h-[160px] w-full rounded-card-lg" />
      </div>
    </div>
  );
}
