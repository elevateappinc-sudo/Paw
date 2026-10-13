import { Suspense } from "react";
import type { Metadata } from "next";
import { EntrenamientoModule } from "@/components/entrenamiento/EntrenamientoModule";
import { EntrenamientoSkeleton } from "@/components/entrenamiento/EntrenamientoSkeleton";

export const metadata: Metadata = { title: "Entrenamiento" };

export default function EntrenamientoPage() {
  return (
    <Suspense fallback={<EntrenamientoSkeleton />}>
      <EntrenamientoModule />
    </Suspense>
  );
}
