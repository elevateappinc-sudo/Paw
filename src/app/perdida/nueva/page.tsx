import { Suspense } from "react";
import type { Metadata } from "next";
import { LostAlertForm } from "@/components/perdida/LostAlertForm";
import Loading from "./loading";

export const metadata: Metadata = { title: "Reportar perdida" };

export default function NuevaAlertaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LostAlertForm />
    </Suspense>
  );
}
