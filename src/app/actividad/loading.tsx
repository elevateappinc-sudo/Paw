import { RouteFallback } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui";

function LoadingContent() {
  return (
    <div className="flex flex-col gap-4 pb-6" aria-busy="true" aria-label="Cargando actividad">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        <Skeleton className="h-[140px] rounded-md" />
        <Skeleton className="h-[140px] rounded-md" />
      </div>
      <div className="px-4">
        <Skeleton className="mb-3 h-6 w-24" />
        <Skeleton className="h-[130px] rounded-md" />
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
