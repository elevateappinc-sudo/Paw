import { Skeleton } from "@/components/ui";
import { PetsListSkeleton } from "@/components/pets/PetsListSkeleton";

export default function MascotasLoading() {
  return (
    <div className="pb-6">
      <div className="flex items-end justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="h-10 w-14 rounded-full" />
      </div>
      <PetsListSkeleton />
    </div>
  );
}
