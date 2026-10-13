import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-8 w-40" />
      </div>
      <div className="flex flex-col gap-3 px-4">
        <Skeleton className="h-[150px] rounded-card-lg" />
        <Skeleton className="h-[52px] rounded-full" />
        <Skeleton className="h-[180px] rounded-card-lg" />
      </div>
    </div>
  );
}
