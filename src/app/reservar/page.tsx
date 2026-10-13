import { Suspense } from "react";
import { BookingFlow } from "@/components/reservar/BookingFlow";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Reservar · Paw" };

function Fallback() {
  return (
    <div className="min-h-dvh bg-bg px-4 pt-[max(14px,env(safe-area-inset-top))]" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-1.5 rounded-full" />
        <Skeleton className="h-1.5 rounded-full" />
        <Skeleton className="h-1.5 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-16 w-full rounded-card-lg" />
      <Skeleton className="mt-3 h-16 w-full rounded-card-lg" />
    </div>
  );
}

export default function ReservarPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <BookingFlow />
    </Suspense>
  );
}
