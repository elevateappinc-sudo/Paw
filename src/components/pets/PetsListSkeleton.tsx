import { Skeleton } from "@/components/ui";

export function PetsListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-2" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-card-lg border border-outline-variant bg-surface p-3">
          <Skeleton className="h-[84px] w-[84px] rounded-[20px]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      ))}
      <Skeleton className="mt-1 h-[54px] w-full rounded-full" />
    </div>
  );
}
