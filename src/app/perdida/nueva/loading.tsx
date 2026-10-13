import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-2 h-8 w-52" />
      </div>
      <div className="flex flex-col gap-4 px-4">
        <Skeleton className="h-[96px] rounded-card-lg" />
        <Skeleton className="h-[170px] rounded-card-lg" />
        <Skeleton className="h-[300px] rounded-card-lg" />
        <Skeleton className="h-[54px] rounded-full" />
      </div>
    </div>
  );
}
