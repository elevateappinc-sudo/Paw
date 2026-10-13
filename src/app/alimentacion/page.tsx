import { Suspense } from "react";
import type { Metadata } from "next";
import { AlimentacionView } from "@/components/alimentacion/AlimentacionView";
import { AlimentacionSkeleton } from "@/components/alimentacion/AlimentacionSkeleton";

export const metadata: Metadata = { title: "Alimentación" };

export default function AlimentacionPage() {
  return (
    <Suspense fallback={<AlimentacionSkeleton />}>
      <AlimentacionView />
    </Suspense>
  );
}
