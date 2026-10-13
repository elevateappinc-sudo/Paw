import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="h-[max(16px,env(safe-area-inset-top))]" />
      <div className="mt-auto flex flex-1 flex-col gap-4 rounded-t-sheet bg-surface px-5 pt-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-[14px]" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="h-[72px] w-full rounded-card-lg" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-11 rounded-full" />
          <Skeleton className="h-11 rounded-full" />
        </div>
        <Skeleton className="h-[260px] w-full rounded-card-lg" />
        <Skeleton className="h-[140px] w-full rounded-card-lg" />
      </div>
    </div>
  );
}
