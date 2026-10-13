import { Suspense } from "react";
import type { Metadata } from "next";
import { SaludView } from "@/components/salud/SaludView";
import { SaludSkeleton } from "@/components/salud/SaludSkeleton";

export const metadata: Metadata = { title: "Salud" };

export default function SaludPage() {
  return (
    <Suspense fallback={<SaludSkeleton />}>
      <SaludView />
    </Suspense>
  );
}
