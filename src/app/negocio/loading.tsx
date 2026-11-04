import { RouteFallback } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui";

function LoadingContent() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-8 w-48" />
      </div>
      <div className="flex flex-col gap-3 px-4">
        <Skeleton className="h-[72px] rounded-md" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-[76px] rounded-md" />
        <Skeleton className="h-[200px] rounded-md" />
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
