import { RouteFallback } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui";

function LoadingContent() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg px-4 pt-[max(16px,env(safe-area-inset-top))]" aria-hidden="true">
      <div className="flex w-full">
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-7 w-32" />
      <div className="mt-4 flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-8 h-32 w-32 rounded-full" />
      <Skeleton className="mt-3 h-5 w-20" />
      <div className="mt-6 flex gap-8">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-14 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-8 h-48 w-full rounded-lg" />
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
