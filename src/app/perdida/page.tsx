import { Suspense } from "react";
import type { Metadata } from "next";
import { NearbyLostList } from "@/components/perdida/NearbyLostList";
import Loading from "./loading";

export const metadata: Metadata = { title: "Mascotas perdidas" };

export default function PerdidaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NearbyLostList />
    </Suspense>
  );
}
