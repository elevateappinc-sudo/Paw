import { Suspense } from "react";
import { ExplorarView } from "@/components/explorar/ExplorarView";
import { ExplorarSkeleton } from "@/components/explorar/ExplorarSkeleton";

export const metadata = { title: "Explorar · Paw" };

export default function ExplorarPage() {
  return (
    <Suspense fallback={<ExplorarSkeleton />}>
      <ExplorarView />
    </Suspense>
  );
}
