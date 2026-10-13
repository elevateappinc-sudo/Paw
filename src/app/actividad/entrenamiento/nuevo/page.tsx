"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntrenamientoSkeleton } from "@/components/entrenamiento/EntrenamientoSkeleton";

export default function NuevoEntrenamientoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/actividad/entrenamiento?nuevo=1");
  }, [router]);
  return <EntrenamientoSkeleton />;
}
