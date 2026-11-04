import { RouteFallback } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui";

function LoadingContent() {
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <div className="flex items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-11 w-11 rounded-sm" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <Skeleton className="h-14 w-3/4 rounded-md" />
        <Skeleton className="ml-auto h-10 w-1/2 rounded-md" />
        <Skeleton className="h-20 w-4/5 rounded-md" />
      </div>
      <div className="border-t border-border bg-surface px-4 py-3">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
