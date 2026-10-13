import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-8 w-56" />
      </div>
      <div className="flex gap-2 px-4 pb-3">
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="ml-auto h-9 w-32 rounded-full" />
      </div>
      <div className="flex flex-col gap-3 px-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[196px] w-full rounded-card-lg" />
        ))}
      </div>
    </div>
  );
}
