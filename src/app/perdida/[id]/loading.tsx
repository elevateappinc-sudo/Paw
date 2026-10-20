import { RouteFallback } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui";
import { LostModeRoot } from "@/components/perdida/LostMode";

function LoadingContent() {
  return (
    <LostModeRoot>
      <div className="flex items-center gap-2 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-40" />
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4" aria-busy="true">
        <Skeleton className="h-36 rounded-md" />
        <Skeleton className="h-44 rounded-md" />
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
