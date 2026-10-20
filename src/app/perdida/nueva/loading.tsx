import { RouteFallback } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui";
import { LostModeRoot } from "@/components/perdida/LostMode";

function LoadingContent() {
  return (
    <LostModeRoot>
      <div className="flex items-center gap-2 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-52" />
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4" aria-busy="true">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-44 rounded-md" />
        <Skeleton className="h-72 rounded-md" />
        <Skeleton className="h-13 rounded-full" />
      </div>
    </LostModeRoot>
  );
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
