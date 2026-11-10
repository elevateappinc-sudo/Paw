import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AssistantScreen } from "@/components/asistente/AssistantScreen";
import { FEATURES } from "@/lib/features";
import Loading from "./loading";

export const metadata: Metadata = { title: "Asistente" };

export default function AsistentePage() {
  if (!FEATURES.assistant) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <AssistantScreen />
    </Suspense>
  );
}
