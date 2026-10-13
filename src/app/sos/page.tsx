import { Suspense } from "react";
import type { Metadata } from "next";
import { SosSheet } from "@/components/sos/SosSheet";
import Loading from "./loading";

export const metadata: Metadata = { title: "Urgencia" };

export default function SosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SosSheet />
    </Suspense>
  );
}
