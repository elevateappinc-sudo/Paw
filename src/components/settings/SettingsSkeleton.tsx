import { Skeleton, SkeletonRow } from "@/components/ui";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-8" aria-busy="true" aria-label="Cargando ajustes">
      <div className="flex items-end justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <div className="flex items-end gap-2">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="px-4">
          <Skeleton className="mb-3 h-6 w-32" />
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      ))}
    </div>
  );
}
