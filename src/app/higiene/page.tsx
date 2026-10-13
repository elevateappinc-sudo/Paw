import { Suspense } from "react";
import type { Metadata } from "next";
import { HigieneView } from "@/components/higiene/HigieneView";
import { HigieneSkeleton } from "@/components/higiene/HigieneSkeleton";

export const metadata: Metadata = { title: "Higiene y peluquería" };

export default function HigienePage() {
  return (
    <Suspense fallback={<HigieneSkeleton />}>
      <HigieneView />
    </Suspense>
  );
}
