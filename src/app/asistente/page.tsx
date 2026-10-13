import { Suspense } from "react";
import type { Metadata } from "next";
import { AssistantScreen } from "@/components/asistente/AssistantScreen";
import Loading from "./loading";

export const metadata: Metadata = { title: "Asistente" };

export default function AsistentePage() {
  return (
    <Suspense fallback={<Loading />}>
      <AssistantScreen />
    </Suspense>
  );
}
